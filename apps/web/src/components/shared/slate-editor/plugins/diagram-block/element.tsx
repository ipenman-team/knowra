'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compartment, EditorState } from '@codemirror/state';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers as codeMirrorLineNumbers,
  placeholder,
} from '@codemirror/view';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Expand,
  FoldVertical,
  Play,
  UnfoldVertical,
} from 'lucide-react';
import { Node } from 'slate';
import {
  useFocused,
  useSelected,
  useSlateStatic,
  type RenderElementProps,
} from 'slate-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { BlockElementHandleMenu } from '../block-element-handle-menu';
import {
  findElementPathSafe,
  focusCursorAfterBlockElement,
  shouldIgnoreBlockPointerTarget,
} from '../block-plugin-utils';
import { PLUGIN_SCOPE_BLOCK } from '../types';
import {
  DIAGRAM_BLOCK_TYPE,
  DIAGRAM_ENGINE_OPTIONS,
  DIAGRAM_TEMPLATES,
  getDiagramCode,
  getDiagramEngine,
  getDiagramLineNumbers,
  getDiagramPreview,
  getDiagramTemplate,
  getDiagramTemplateId,
  removeDiagramBlock,
  type DiagramBlockElement,
  type DiagramEngine,
  type DiagramTemplateId,
  updateDiagramBlock,
} from './logic';
import { renderMermaidToSvg } from './mermaid-renderer';

type DiagramBlockElementViewProps = RenderElementProps & {
  readOnly?: boolean;
};

type DiagramPatch = {
  engine?: DiagramEngine;
  templateId?: DiagramTemplateId;
  code?: string;
  preview?: boolean;
  lineNumbers?: boolean;
};

const mermaidEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
  },
  '.cm-scroller': {
    fontFamily:
      'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '12px 14px',
  },
  '.cm-gutters': {
    borderRight: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--muted) / 0.35)',
  },
  '.cm-activeLine': {
    backgroundColor: 'hsl(var(--muted) / 0.35)',
  },
  '&.cm-focused': {
    outline: 'none',
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
  const selected = useSelected();
  const focused = useFocused();
  const element = props.element as DiagramBlockElement;
  const readOnly = Boolean(props.readOnly ?? false);
  const isActive = selected && focused;

  const engine = getDiagramEngine(element.engine);
  const templateId = getDiagramTemplateId(element.templateId);
  const code = getDiagramCode(element.code, templateId) || Node.string(element);
  const previewEnabled = getDiagramPreview(element.preview);
  const lineNumbersEnabled = getDiagramLineNumbers(element.lineNumbers);

  const [svg, setSvg] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false);
  const [isSourceEditorFocused, setIsSourceEditorFocused] = useState(false);
  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState(false);
  const [isRestoringEditorFocus, setIsRestoringEditorFocus] = useState(false);

  const renderSequenceRef = useRef(0);
  const sourceCollapsed = previewEnabled ? isSourceCollapsed : false;
  const mergedRenderError =
    engine === 'mermaid' ? renderError : '当前仅支持 Mermaid 预览';

  const patchElement = useCallback(
    (patch: DiagramPatch) => {
      const path = findElementPathSafe(editor, element);
      if (!path) return;
      updateDiagramBlock(editor, path, patch);
    },
    [editor, element],
  );

  useEffect(() => {
    if (engine !== 'mermaid' || !previewEnabled) return;

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
      setIsRestoringEditorFocus(true);
      window.requestAnimationFrame(() => {
        setIsRestoringEditorFocus(false);
      });
    },
    [patchElement],
  );

  const onTogglePreview = useCallback(() => {
    patchElement({ preview: !previewEnabled });
  }, [patchElement, previewEnabled]);

  const onToggleSourceCollapsed = useCallback(() => {
    setIsSourceCollapsed((prev) => !prev);
  }, []);

  const onDelete = useCallback(() => {
    const path = findElementPathSafe(editor, element);
    if (!path) return;
    removeDiagramBlock(editor, path);
  }, [editor, element]);

  const onOpenFullscreen = useCallback(() => {
    setIsFullscreenOpen(true);
  }, []);

  const onMoveCursorAfterByContextMenu = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (readOnly || !selected) return;
      if (shouldIgnoreBlockPointerTarget(event.target)) return;
      focusCursorAfterBlockElement(editor, element);
    },
    [editor, element, readOnly, selected],
  );
  const showFloatingToolbar =
    !readOnly &&
    (selected ||
      isSourceEditorFocused ||
      isTemplateSelectOpen ||
      isRestoringEditorFocus);

  return (
    <div
      {...props.attributes}
      data-plugin-scope={element.pluginScope ?? PLUGIN_SCOPE_BLOCK}
      data-plugin-kind={element.pluginKind ?? DIAGRAM_BLOCK_TYPE}
      className="group/block relative my-2"
      onContextMenuCapture={onMoveCursorAfterByContextMenu}
    >
      <BlockElementHandleMenu
        active={isActive}
        onDelete={onDelete}
        deleteDisabled={readOnly}
        actions={[
          {
            key: 'diagram-fullscreen',
            label: '全屏编辑',
            icon: Expand,
            onSelect: onOpenFullscreen,
          },
        ]}
      />

      {!readOnly ? (
        <div
          contentEditable={false}
          className={cn(
            'absolute left-0 top-0 z-30 -translate-y-[calc(100%+8px)] transition-opacity',
            showFloatingToolbar
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0',
          )}
        >
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm">
            <Select value={engine} disabled>
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
              value={templateId}
              disabled={readOnly}
              onOpenChange={setIsTemplateSelectOpen}
              onValueChange={onTemplateChange}
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

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>行号</span>
              <Switch
                checked={lineNumbersEnabled}
                disabled={readOnly}
                onCheckedChange={(checked) => patchElement({ lineNumbers: checked })}
              />
            </label>

            <Button
              type="button"
              variant={previewEnabled ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              disabled={readOnly}
              onClick={onTogglePreview}
              tooltip="切换预览"
            >
              {previewEnabled ? <Eye /> : <EyeOff />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              disabled={!previewEnabled}
              onClick={onToggleSourceCollapsed}
              tooltip={sourceCollapsed ? '展开语法编辑区' : '折叠语法编辑区'}
            >
              {sourceCollapsed ? <UnfoldVertical /> : <FoldVertical />}
            </Button>
          </div>
        </div>
      ) : null}

      <div
        contentEditable={false}
        className="bg-background transition-colors"
      >
        <DiagramWorkspace
          code={code}
          readOnly={readOnly}
          previewEnabled={previewEnabled}
          sourceCollapsed={sourceCollapsed}
          lineNumbersEnabled={lineNumbersEnabled}
          svg={svg}
          renderError={mergedRenderError}
          isRendering={isRendering}
          onCodeChange={(nextCode) => patchElement({ code: nextCode })}
          onToggleSourceCollapsed={onToggleSourceCollapsed}
          onFocusChange={setIsSourceEditorFocused}
          className="h-[360px]"
        />
      </div>

      <DiagramFullscreenDialog
        open={isFullscreenOpen}
        onOpenChange={setIsFullscreenOpen}
        readOnly={readOnly}
        engine={engine}
        templateId={templateId}
        previewEnabled={previewEnabled}
        isSourceCollapsed={sourceCollapsed}
        lineNumbersEnabled={lineNumbersEnabled}
        code={code}
        svg={svg}
        renderError={mergedRenderError}
        isRendering={isRendering}
        onToggleSourceCollapsed={onToggleSourceCollapsed}
        onTemplateChange={onTemplateChange}
        onTogglePreview={onTogglePreview}
        onLineNumbersChange={(nextEnabled) =>
          patchElement({ lineNumbers: nextEnabled })
        }
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
  lineNumbersEnabled: boolean;
  code: string;
  svg: string;
  renderError: string | null;
  isRendering: boolean;
  onToggleSourceCollapsed: () => void;
  onTemplateChange: (templateId: string) => void;
  onTogglePreview: () => void;
  onCodeChange: (code: string) => void;
  onLineNumbersChange: (enabled: boolean) => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="inset-0 left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-none p-0 sm:rounded-none [&>button]:hidden">
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
              variant={props.previewEnabled ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              disabled={props.readOnly}
              onClick={props.onTogglePreview}
            >
              {props.previewEnabled ? <Eye /> : <EyeOff />}
            </Button>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>行号</span>
              <Switch
                checked={props.lineNumbersEnabled}
                disabled={props.readOnly}
                onCheckedChange={props.onLineNumbersChange}
              />
            </label>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              disabled={!props.previewEnabled}
              onClick={props.onToggleSourceCollapsed}
            >
              {props.isSourceCollapsed ? <UnfoldVertical /> : <FoldVertical />}
            </Button>

            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-8 px-2"
              >
                退出全屏
              </Button>
            </DialogClose>
          </div>

          <DiagramWorkspace
            code={props.code}
            readOnly={props.readOnly}
            previewEnabled={props.previewEnabled}
            sourceCollapsed={props.isSourceCollapsed}
            lineNumbersEnabled={props.lineNumbersEnabled}
            svg={props.svg}
            renderError={props.renderError}
            isRendering={props.isRendering}
            onCodeChange={props.onCodeChange}
            onToggleSourceCollapsed={props.onToggleSourceCollapsed}
            className="min-h-0 flex-1"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DiagramWorkspace(props: {
  code: string;
  readOnly: boolean;
  previewEnabled: boolean;
  sourceCollapsed: boolean;
  lineNumbersEnabled: boolean;
  svg: string;
  renderError: string | null;
  isRendering: boolean;
  onCodeChange: (code: string) => void;
  onToggleSourceCollapsed: () => void;
  onFocusChange?: (focused: boolean) => void;
  className?: string;
}) {
  return (
    <div
      className={cn('relative flex min-h-0 overflow-hidden', props.className)}
    >
      {!props.sourceCollapsed ? (
        <div
          className={cn(
            'min-h-0 min-w-0',
            props.previewEnabled ? 'w-1/2' : 'w-full',
          )}
        >
          <DiagramSourceEditor
            value={props.code}
            readOnly={props.readOnly}
            lineNumbersEnabled={props.lineNumbersEnabled}
            onChange={props.onCodeChange}
            onFocusChange={props.onFocusChange}
          />
        </div>
      ) : null}

      {props.previewEnabled ? (
        <DiagramPreviewPane
          svg={props.svg}
          renderError={props.renderError}
          isRendering={props.isRendering}
          previewEnabled={props.previewEnabled}
          className={cn('min-h-0', props.sourceCollapsed ? 'w-full' : 'w-1/2')}
        />
      ) : null}

      {props.previewEnabled ? (
        <PaneCollapseHandle
          collapsed={props.sourceCollapsed}
          onToggle={props.onToggleSourceCollapsed}
        />
      ) : null}
    </div>
  );
}

function PaneCollapseHandle(props: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={cn(
          'absolute top-1/2 z-[2] -translate-y-1/2 rounded-full border border-input bg-muted/90 p-1 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground',
          props.collapsed ? 'left-2' : 'left-1/2 -translate-x-1/2',
        )}
        onClick={props.onToggle}
        aria-label={props.collapsed ? '展开语法编辑区' : '折叠语法编辑区'}
      >
        {props.collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </>
  );
}

function DiagramSourceEditor(props: {
  value: string;
  readOnly: boolean;
  lineNumbersEnabled: boolean;
  onChange: (value: string) => void;
  onFocusChange?: (focused: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(props.onChange);
  const onFocusChangeRef = useRef(props.onFocusChange);
  const latestValueRef = useRef(props.value);
  const lineNumbersEnabledRef = useRef(props.lineNumbersEnabled);

  const lineNumbersCompartment = useMemo(() => new Compartment(), []);
  const editableCompartment = useMemo(() => new Compartment(), []);
  const readOnlyCompartment = useMemo(() => new Compartment(), []);

  useEffect(() => {
    onChangeRef.current = props.onChange;
  }, [props.onChange]);

  useEffect(() => {
    onFocusChangeRef.current = props.onFocusChange;
  }, [props.onFocusChange]);

  useEffect(() => {
    lineNumbersEnabledRef.current = props.lineNumbersEnabled;
  }, [props.lineNumbersEnabled]);

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
        lineNumbersCompartment.of(
          lineNumbersEnabledRef.current ? codeMirrorLineNumbers() : [],
        ),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
        mermaidEditorTheme,
        stopSlateEventBubbling,
        placeholder('输入 Mermaid 语法...'),
        editableCompartment.of(EditorView.editable.of(!props.readOnly)),
        readOnlyCompartment.of(EditorState.readOnly.of(props.readOnly)),
        EditorView.updateListener.of((update) => {
          if (update.focusChanged) {
            onFocusChangeRef.current?.(update.view.hasFocus);
          }
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
  }, [
    editableCompartment,
    lineNumbersCompartment,
    props.readOnly,
    readOnlyCompartment,
  ]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        lineNumbersCompartment.reconfigure(
          props.lineNumbersEnabled ? codeMirrorLineNumbers() : [],
        ),
        editableCompartment.reconfigure(
          EditorView.editable.of(!props.readOnly),
        ),
        readOnlyCompartment.reconfigure(
          EditorState.readOnly.of(props.readOnly),
        ),
      ],
    });
  }, [
    editableCompartment,
    lineNumbersCompartment,
    props.lineNumbersEnabled,
    props.readOnly,
    readOnlyCompartment,
  ]);

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
          'flex items-center justify-center bg-muted/20 px-4 text-sm text-muted-foreground',
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
          'flex items-center justify-center bg-muted/20 px-4 text-sm text-destructive',
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
          'flex items-center justify-center bg-muted/20 px-4 text-sm text-muted-foreground',
          props.className,
        )}
      >
        <Play className="mr-2 h-4 w-4 animate-pulse" /> 渲染中...
      </div>
    );
  }

  return (
    <div className={cn('overflow-auto bg-muted/20 p-4', props.className)}>
      <div
        className={cn(
          'mx-auto w-fit bg-background p-2',
          '[&_svg]:h-auto [&_svg]:max-w-full',
        )}
        dangerouslySetInnerHTML={{ __html: props.svg }}
      />
    </div>
  );
}

function formatDiagramError(error: unknown) {
  if (error instanceof Error && error.message)
    return `Mermaid 渲染失败：${error.message}`;
  return 'Mermaid 渲染失败，请检查语法。';
}

function stopEventPropagation(event: Event) {
  event.stopPropagation();
  return false;
}
