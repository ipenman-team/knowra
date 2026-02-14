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
import {
  Eye,
  EyeOff,
  Expand,
  FoldVertical,
  Play,
  Trash2,
  UnfoldVertical,
} from "lucide-react";
import { Node } from "slate";
import { ReactEditor, useSlateStatic, type RenderElementProps } from "slate-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  DIAGRAM_ENGINE_OPTIONS,
  DIAGRAM_TEMPLATES,
  getDiagramCode,
  getDiagramEngine,
  getDiagramPreview,
  getDiagramTemplate,
  getDiagramTemplateId,
  removeDiagramBlock,
  type DiagramBlockElement,
  type DiagramEngine,
  type DiagramTemplateId,
  updateDiagramBlock,
} from "./logic";
import { renderMermaidToSvg } from "./mermaid-renderer";

type DiagramBlockElementViewProps = RenderElementProps & {
  readOnly?: boolean;
};

type DiagramPatch = {
  engine?: DiagramEngine;
  templateId?: DiagramTemplateId;
  code?: string;
  preview?: boolean;
};

const mermaidEditorTheme = EditorView.theme({
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
    padding: "12px 14px",
  },
  ".cm-gutters": {
    borderRight: "1px solid hsl(var(--border))",
    backgroundColor: "hsl(var(--muted) / 0.35)",
  },
  ".cm-activeLine": {
    backgroundColor: "hsl(var(--muted) / 0.35)",
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

export function DiagramBlockElementView(props: DiagramBlockElementViewProps) {
  const editor = useSlateStatic();
  const element = props.element as DiagramBlockElement;
  const readOnly = Boolean(props.readOnly ?? false);

  const engine = getDiagramEngine(element.engine);
  const templateId = getDiagramTemplateId(element.templateId);
  const code = getDiagramCode(element.code, templateId) || Node.string(element);
  const previewEnabled = getDiagramPreview(element.preview);

  const [svg, setSvg] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false);

  const renderSequenceRef = useRef(0);
  const sourceCollapsed = previewEnabled ? isSourceCollapsed : false;
  const mergedRenderError =
    engine === "mermaid" ? renderError : "当前仅支持 Mermaid 预览";

  const patchElement = useCallback(
    (patch: DiagramPatch) => {
      const path = findPathSafe(editor, element);
      if (!path) return;
      updateDiagramBlock(editor, path, patch);
    },
    [editor, element],
  );

  useEffect(() => {
    if (engine !== "mermaid" || !previewEnabled) return;

    let disposed = false;
    const taskId = ++renderSequenceRef.current;

    const timer = window.setTimeout(() => {
      setIsRendering(true);

      void renderMermaidToSvg(code, `mermaid-diagram-${taskId}`)
        .then((nextSvg) => {
          if (disposed || taskId !== renderSequenceRef.current) return;
          setSvg(nextSvg);
          setRenderError(null);
        })
        .catch((error: unknown) => {
          if (disposed || taskId !== renderSequenceRef.current) return;
          setRenderError(formatDiagramError(error));
        })
        .finally(() => {
          if (disposed || taskId !== renderSequenceRef.current) return;
          setIsRendering(false);
        });
    }, 180);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
    };
  }, [code, engine, previewEnabled]);

  const onTemplateChange = useCallback(
    (nextTemplateId: string) => {
      const nextTemplate = getDiagramTemplate(nextTemplateId);
      patchElement({
        templateId: nextTemplate.id,
        code: nextTemplate.code,
        preview: true,
      });
    },
    [patchElement],
  );

  const onTogglePreview = useCallback(() => {
    patchElement({ preview: !previewEnabled });
  }, [patchElement, previewEnabled]);

  const onDelete = useCallback(() => {
    const path = findPathSafe(editor, element);
    if (!path) return;
    removeDiagramBlock(editor, path);
  }, [editor, element]);

  return (
    <div {...props.attributes} className="my-2">
      <div
        contentEditable={false}
        className="overflow-hidden rounded-md border border-input bg-background shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <span className="mr-2 text-sm font-medium">文本绘图</span>

          <Select
            value={engine}
            disabled
            onValueChange={(nextEngine) => patchElement({ engine: nextEngine as DiagramEngine })}
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIAGRAM_ENGINE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={templateId} disabled={readOnly} onValueChange={onTemplateChange}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIAGRAM_TEMPLATES.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={previewEnabled ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2"
            disabled={readOnly}
            onClick={onTogglePreview}
          >
            {previewEnabled ? <Eye /> : <EyeOff />}
            预览
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-8 px-2"
            onClick={() => {
              setIsFullscreenOpen(true);
              setIsSourceCollapsed(false);
            }}
          >
            <Expand />
            全屏编辑
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={readOnly}
            onClick={onDelete}
            aria-label="删除绘图块"
          >
            <Trash2 />
          </Button>
        </div>

        <DiagramPreviewPane
          svg={svg}
          renderError={mergedRenderError}
          isRendering={isRendering}
          previewEnabled={previewEnabled}
          className="h-[300px]"
        />

        <div className="border-t bg-muted/20 px-3 py-1 text-xs text-muted-foreground">
          语法区默认折叠，仅在全屏编辑中显示。
        </div>
      </div>

      <DiagramFullscreenDialog
        open={isFullscreenOpen}
        onOpenChange={setIsFullscreenOpen}
        readOnly={readOnly}
        engine={engine}
        templateId={templateId}
        previewEnabled={previewEnabled}
        isSourceCollapsed={sourceCollapsed}
        code={code}
        svg={svg}
        renderError={mergedRenderError}
        isRendering={isRendering}
        onSetSourceCollapsed={setIsSourceCollapsed}
        onTemplateChange={onTemplateChange}
        onTogglePreview={onTogglePreview}
        onCodeChange={(nextCode) => patchElement({ code: nextCode })}
      />

      <span className="hidden">{props.children}</span>
    </div>
  );
}

function DiagramFullscreenDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
  engine: DiagramEngine;
  templateId: DiagramTemplateId;
  previewEnabled: boolean;
  isSourceCollapsed: boolean;
  code: string;
  svg: string;
  renderError: string | null;
  isRendering: boolean;
  onSetSourceCollapsed: (collapsed: boolean) => void;
  onTemplateChange: (templateId: string) => void;
  onTogglePreview: () => void;
  onCodeChange: (code: string) => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="inset-0 left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-none p-0 sm:rounded-none">
        <DialogTitle className="sr-only">文本绘图全屏编辑</DialogTitle>

        <div className="flex min-h-0 h-full flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
            <span className="mr-2 text-sm font-medium">文本绘图</span>

            <Select value={props.engine} disabled>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAGRAM_ENGINE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={props.templateId}
              disabled={props.readOnly}
              onValueChange={props.onTemplateChange}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIAGRAM_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant={props.previewEnabled ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              disabled={props.readOnly}
              onClick={props.onTogglePreview}
            >
              {props.previewEnabled ? <Eye /> : <EyeOff />}
              预览
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              disabled={!props.previewEnabled}
              onClick={() => props.onSetSourceCollapsed(!props.isSourceCollapsed)}
            >
              {props.isSourceCollapsed ? <UnfoldVertical /> : <FoldVertical />}
              {props.isSourceCollapsed ? "展开语法" : "折叠语法"}
            </Button>

            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm" className="ml-auto h-8 px-2">
                退出全屏
              </Button>
            </DialogClose>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {!props.isSourceCollapsed ? (
              <div
                className={cn(
                  "min-h-0 border-r",
                  props.previewEnabled ? "w-1/2" : "w-full",
                )}
              >
                <DiagramSourceEditor
                  value={props.code}
                  readOnly={props.readOnly}
                  onChange={props.onCodeChange}
                />
              </div>
            ) : null}

            {props.previewEnabled ? (
              <DiagramPreviewPane
                svg={props.svg}
                renderError={props.renderError}
                isRendering={props.isRendering}
                previewEnabled={props.previewEnabled}
                className={cn("min-h-0", props.isSourceCollapsed ? "w-full" : "flex-1")}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                预览已关闭，可重新开启。
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DiagramSourceEditor(props: {
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(props.onChange);
  const latestValueRef = useRef(props.value);

  const editableCompartment = useMemo(() => new Compartment(), []);
  const readOnlyCompartment = useMemo(() => new Compartment(), []);

  useEffect(() => {
    onChangeRef.current = props.onChange;
  }, [props.onChange]);

  useEffect(() => {
    latestValueRef.current = props.value;

    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue === props.value) return;

    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: props.value,
      },
    });
  }, [props.value]);

  useEffect(() => {
    if (!rootRef.current || viewRef.current) return;

    const state = EditorState.create({
      doc: latestValueRef.current,
      extensions: [
        history(),
        lineNumbers(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
        mermaidEditorTheme,
        stopSlateEventBubbling,
        placeholder("输入 Mermaid 语法..."),
        editableCompartment.of(EditorView.editable.of(!props.readOnly)),
        readOnlyCompartment.of(EditorState.readOnly.of(props.readOnly)),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;

          const nextValue = update.state.doc.toString();
          if (nextValue === latestValueRef.current) return;

          latestValueRef.current = nextValue;
          onChangeRef.current(nextValue);
        }),
      ],
    });

    const view = new EditorView({
      parent: rootRef.current,
      state,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [editableCompartment, props.readOnly, readOnlyCompartment]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        editableCompartment.reconfigure(EditorView.editable.of(!props.readOnly)),
        readOnlyCompartment.reconfigure(EditorState.readOnly.of(props.readOnly)),
      ],
    });
  }, [editableCompartment, props.readOnly, readOnlyCompartment]);

  return <div ref={rootRef} className="h-full w-full" />;
}

function DiagramPreviewPane(props: {
  svg: string;
  renderError: string | null;
  isRendering: boolean;
  previewEnabled: boolean;
  className?: string;
}) {
  if (!props.previewEnabled) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/20 px-4 text-sm text-muted-foreground",
          props.className,
        )}
      >
        预览已关闭。
      </div>
    );
  }

  if (props.renderError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/20 px-4 text-sm text-destructive",
          props.className,
        )}
      >
        {props.renderError}
      </div>
    );
  }

  if (props.isRendering && !props.svg) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/20 px-4 text-sm text-muted-foreground",
          props.className,
        )}
      >
        <Play className="mr-2 h-4 w-4 animate-pulse" /> 渲染中...
      </div>
    );
  }

  return (
    <div className={cn("overflow-auto bg-muted/20 p-4", props.className)}>
      <div
        className={cn(
          "mx-auto w-fit rounded-md bg-background p-2 shadow-sm",
          "[&_svg]:h-auto [&_svg]:max-w-full",
        )}
        dangerouslySetInnerHTML={{ __html: props.svg }}
      />
    </div>
  );
}

function findPathSafe(editor: ReturnType<typeof useSlateStatic>, element: DiagramBlockElement) {
  try {
    return ReactEditor.findPath(editor as ReactEditor, element);
  } catch {
    return null;
  }
}

function formatDiagramError(error: unknown) {
  if (error instanceof Error && error.message) return `Mermaid 渲染失败：${error.message}`;
  return "Mermaid 渲染失败，请检查语法。";
}

function stopEventPropagation(event: Event) {
  event.stopPropagation();
  return false;
}
