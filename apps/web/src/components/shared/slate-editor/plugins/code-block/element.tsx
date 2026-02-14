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
import { Check, Copy, Trash2 } from "lucide-react";
import { Resizable } from "re-resizable";
import { Node } from "slate";
import { ReactEditor, useSlateStatic, type RenderElementProps } from "slate-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { loadCodeLanguageExtension } from "./codemirror-language";
import {
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
  const element = props.element as CodeBlockElement;
  const readOnly = Boolean(props.readOnly ?? false);

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
      const path = findPathSafe(editor, element);
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
        lineNumbers(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        codeMirrorTheme,
        stopSlateEventBubbling,
        placeholder("输入代码..."),
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
    const path = findPathSafe(editor, element);
    if (!path) return;
    removeCodeBlock(editor, path);
  }, [editor, element]);

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
    <div {...props.attributes} className="my-2">
      <div
        contentEditable={false}
        className="overflow-hidden rounded-md border border-input bg-background shadow-sm"
      >
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

          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onCopy}
              aria-label="复制代码"
            >
              {copied ? <Check /> : <Copy />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={readOnly}
              onClick={onDelete}
              aria-label="删除代码块"
            >
              <Trash2 />
            </Button>
          </div>
        </div>

        <Resizable
          size={{ width: "100%", height }}
          minHeight={MIN_CODE_BLOCK_HEIGHT}
          maxHeight={MAX_CODE_BLOCK_HEIGHT}
          enable={
            readOnly
              ? false
              : {
                  top: false,
                  right: false,
                  bottom: true,
                  left: false,
                  topRight: false,
                  bottomRight: false,
                  bottomLeft: false,
                  topLeft: false,
                }
          }
          handleStyles={{
            bottom: {
              bottom: 0,
              height: "14px",
              left: 0,
              right: 0,
              cursor: readOnly ? "not-allowed" : "ns-resize",
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
                  readOnly && "opacity-40",
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
      </div>

      <span className="hidden">{props.children}</span>
    </div>
  );
}

type CodePatch = {
  language?: CodeLanguage;
  code?: string;
  wrap?: boolean;
  height?: number;
};

function findPathSafe(editor: ReturnType<typeof useSlateStatic>, element: CodeBlockElement) {
  try {
    return ReactEditor.findPath(editor as ReactEditor, element);
  } catch {
    return null;
  }
}

function stopEventPropagation(event: Event) {
  event.stopPropagation();
  return false;
}
