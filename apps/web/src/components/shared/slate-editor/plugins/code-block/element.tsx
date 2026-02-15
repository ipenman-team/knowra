"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import { Check, Copy } from "lucide-react";
import { Resizable } from "re-resizable";
import { Node } from "slate";
import {
  useFocused,
  useSelected,
  useSlateStatic,
  type RenderElementProps,
} from "slate-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { BlockElementHandleMenu } from "../block-element-handle-menu";
import {
  findElementPathSafe,
  focusCursorAfterBlockElement,
  shouldIgnoreBlockPointerTarget,
} from "../block-plugin-utils";
import { PLUGIN_SCOPE_BLOCK } from "../types";
import { loadCodeLanguageExtension } from "./codemirror-language";
import {
  CODE_BLOCK_TYPE,
  CODE_LANGUAGE_OPTIONS,
  getCodeBlockCode,
  getCodeBlockHeight,
  getCodeBlockLanguage,
  getCodeBlockWrap,
  MAX_CODE_BLOCK_HEIGHT,
  MIN_CODE_BLOCK_HEIGHT,
  removeCodeBlock,
  type CodeBlockElement,
  type CodeLanguage,
  updateCodeBlock,
} from "./logic";

type CodeBlockElementViewProps = RenderElementProps & {
  readOnly?: boolean;
};

const codeMirrorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
  },
  ".cm-scroller": {
    fontFamily:
      "ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
  },
  ".cm-content": {
    minHeight: "100%",
    padding: "12px 16px",
  },
  ".cm-gutters": {
    borderRight: "1px solid hsl(var(--border))",
    backgroundColor: "hsl(var(--muted) / 0.35)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    color: "hsl(var(--muted-foreground) / 0.7)",
  },
  ".cm-activeLine": {
    backgroundColor: "hsl(var(--muted) / 0.35)",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "hsl(var(--muted) / 0.45)",
  },
  "&.cm-focused": {
    outline: "none",
  },
});

const stopSlateEventBubbling = EditorView.domEventHandlers({
  keydown: stopEventPropagation,
  keyup: stopEventPropagation,
  beforeinput: stopEventPropagation,
  input: stopEventPropagation,
  compositionstart: stopEventPropagation,
  compositionupdate: stopEventPropagation,
  compositionend: stopEventPropagation,
  paste: stopEventPropagation,
  copy: stopEventPropagation,
  cut: stopEventPropagation,
});

export function CodeBlockElementView(props: CodeBlockElementViewProps) {
  const editor = useSlateStatic();
  const selected = useSelected();
  const focused = useFocused();
  const element = props.element as CodeBlockElement;
  const readOnly = Boolean(props.readOnly ?? false);
  const isActive = selected && focused;

  const language = getCodeBlockLanguage(element.language);
  const code = getCodeBlockCode(element.code) || Node.string(element);
  const wrap = getCodeBlockWrap(element.wrap);
  const height = getCodeBlockHeight(element.height);

  const [copied, setCopied] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const codeMirrorRootRef = useRef<HTMLDivElement>(null);
  const codeMirrorViewRef = useRef<EditorView | null>(null);
  const latestCodeRef = useRef(code);
  const readOnlyRef = useRef(readOnly);
  const wrapRef = useRef(wrap);
  const patchElementRef = useRef<(patch: CodePatch) => void>(() => {});

  const languageCompartment = useMemo(() => new Compartment(), []);
  const wrapCompartment = useMemo(() => new Compartment(), []);
  const editableCompartment = useMemo(() => new Compartment(), []);
  const readOnlyCompartment = useMemo(() => new Compartment(), []);

  const patchElement = useCallback(
    (patch: CodePatch) => {
      const path = findElementPathSafe(editor, element);
      if (!path) return;
      updateCodeBlock(editor, path, patch);
    },
    [editor, element],
  );

  useEffect(() => {
    patchElementRef.current = patchElement;
  }, [patchElement]);

  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  useEffect(() => {
    wrapRef.current = wrap;
  }, [wrap]);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => {
      setCopied(false);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  useEffect(() => {
    if (!codeMirrorRootRef.current || codeMirrorViewRef.current) return;

    const state = EditorState.create({
      doc: latestCodeRef.current,
      extensions: [
        history(),
        readOnlyRef.current ? [] : lineNumbers(),
        drawSelection(),
        readOnlyRef.current ? [] : highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        codeMirrorTheme,
        stopSlateEventBubbling,
        readOnlyRef.current ? [] : placeholder("输入代码..."),
        languageCompartment.of([]),
        wrapCompartment.of(wrapRef.current ? EditorView.lineWrapping : []),
        editableCompartment.of(EditorView.editable.of(!readOnlyRef.current)),
        readOnlyCompartment.of(EditorState.readOnly.of(readOnlyRef.current)),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;

          const nextCode = update.state.doc.toString();
          if (nextCode === latestCodeRef.current) return;

          latestCodeRef.current = nextCode;
          patchElementRef.current({ code: nextCode });
        }),
      ],
    });

    const view = new EditorView({
      parent: codeMirrorRootRef.current,
      state,
    });

    codeMirrorViewRef.current = view;

    return () => {
      view.destroy();
      codeMirrorViewRef.current = null;
    };
  }, [
    editableCompartment,
    languageCompartment,
    readOnlyCompartment,
    wrapCompartment,
  ]);

  useEffect(() => {
    const view = codeMirrorViewRef.current;
    if (!view) return;

    const currentCode = view.state.doc.toString();
    if (currentCode === code) return;

    view.dispatch({
      changes: { from: 0, to: currentCode.length, insert: code },
    });
  }, [code]);

  useEffect(() => {
    const view = codeMirrorViewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        wrapCompartment.reconfigure(wrap ? EditorView.lineWrapping : []),
        editableCompartment.reconfigure(EditorView.editable.of(!readOnly)),
        readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
      ],
    });
  }, [editableCompartment, readOnly, readOnlyCompartment, wrap, wrapCompartment]);

  useEffect(() => {
    let cancelled = false;

    void loadCodeLanguageExtension(language).then((extension) => {
      if (cancelled) return;

      const view = codeMirrorViewRef.current;
      if (!view) return;

      view.dispatch({
        effects: languageCompartment.reconfigure(extension),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [language, languageCompartment]);

  const onCopy = useCallback(async () => {
    const codeToCopy = codeMirrorViewRef.current?.state.doc.toString() ?? code;

    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [code]);

  const onDelete = useCallback(() => {
    const path = findElementPathSafe(editor, element);
    if (!path) return;
    removeCodeBlock(editor, path);
  }, [editor, element]);

  const onMoveCursorAfter = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (readOnly) return;
      if (event.button !== 0) return;
      if (shouldIgnoreBlockPointerTarget(event.target)) return;

      event.preventDefault();
      focusCursorAfterBlockElement(editor, element);
    },
    [editor, element, readOnly],
  );

  const onMoveCursorAfterByContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (readOnly || !selected) return;
      if (shouldIgnoreBlockPointerTarget(event.target)) return;
      focusCursorAfterBlockElement(editor, element);
    },
    [editor, element, readOnly, selected],
  );

  const onResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const onResize = useCallback(
    (_event: MouseEvent | TouchEvent, _direction: unknown, elementRef: HTMLElement) => {
      patchElement({ height: getCodeBlockHeight(elementRef.offsetHeight) });
    },
    [patchElement],
  );

  const onResizeStop = useCallback(() => {
    setIsResizing(false);
  }, []);

  return (
    <div
      {...props.attributes}
      data-plugin-scope={element.pluginScope ?? PLUGIN_SCOPE_BLOCK}
      data-plugin-kind={element.pluginKind ?? CODE_BLOCK_TYPE}
      className="group/block relative my-2"
      onMouseDownCapture={onMoveCursorAfter}
      onContextMenuCapture={onMoveCursorAfterByContextMenu}
    >
      {!readOnly ? (
        <BlockElementHandleMenu
          active={isActive}
          onDelete={onDelete}
          deleteDisabled={readOnly}
          deleteLabel="删除代码块"
          actions={[
            {
              key: "copy-code",
              label: copied ? "已复制" : "复制代码",
              icon: copied ? Check : Copy,
              onSelect: () => {
                void onCopy();
              },
            },
          ]}
        />
      ) : null}

      <div
        contentEditable={false}
        className={cn(
          "overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors",
          "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/60",
          isActive && "border-blue-500 ring-1 ring-blue-500/60",
        )}
      >
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-3 border-b bg-muted/40 px-3 py-2">
            <Select
              value={language}
              onValueChange={(value) => patchElement({ language: getCodeBlockLanguage(value) })}
              disabled={readOnly}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                {CODE_LANGUAGE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>自动换行</span>
              <Switch
                checked={wrap}
                disabled={readOnly}
                onCheckedChange={(checked) => patchElement({ wrap: checked })}
              />
            </label>
          </div>
        ) : null}

        {readOnly ? (
          <div className="relative" style={{ height }}>
            <div ref={codeMirrorRootRef} className="absolute inset-0" />
          </div>
        ) : (
          <Resizable
            size={{ width: "100%", height }}
            minHeight={MIN_CODE_BLOCK_HEIGHT}
            maxHeight={MAX_CODE_BLOCK_HEIGHT}
            enable={{
              top: false,
              right: false,
              bottom: true,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }}
            handleStyles={{
              bottom: {
                bottom: 0,
                height: "14px",
                left: 0,
                right: 0,
                cursor: "ns-resize",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderTop: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--muted) / 0.2)",
              },
            }}
            handleComponent={{
              bottom: (
                <div
                  className={cn(
                    "h-3 w-12 rounded-full bg-border transition-colors",
                    isResizing && "bg-blue-400",
                  )}
                  aria-label="拖拽调整代码块高度"
                />
              ),
            }}
            onResizeStart={onResizeStart}
            onResize={onResize}
            onResizeStop={onResizeStop}
            className="relative"
          >
            <div ref={codeMirrorRootRef} className="absolute inset-x-0 bottom-[14px] top-0" />
          </Resizable>
        )}
      </div>

      <span className="pointer-events-none h-0 w-0 overflow-hidden opacity-0">
        {props.children}
      </span>
    </div>
  );
}

type CodePatch = {
  language?: CodeLanguage;
  code?: string;
  wrap?: boolean;
  height?: number;
};

function stopEventPropagation(event: Event) {
  event.stopPropagation();
  return false;
}
