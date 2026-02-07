'use client';

import { useLayoutEffect, useRef } from 'react';

import { Separator } from '@/components/ui/separator';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, Plus, StopCircleIcon } from 'lucide-react';

import { ContextaAiAttachments } from './contexta-ai-attachments';
import { ContextaAiSourcesMenu } from './contexta-ai-sources-menu';

export function ContextaAiComposer(props: {
  conversationId: string;
  draft: string;
  onDraftChange: (draft: string) => void;
  canSend: boolean;
  loading: boolean;
  onSend: () => void | Promise<void>;
  onStop: () => void;
  attachments: File[];
  onFilesSelected: (fileList: FileList | null) => void;
  onRemoveAttachment: (index: number) => void;
  spaces: Array<{ id: string; name: string }>;
  internetEnabled: boolean;
  spaceEnabled: boolean;
  selectedSpaceIds: string[];
  carryContext: boolean;
  onInternetEnabledChange: (enabled: boolean) => void;
  onSpaceEnabledChange: (enabled: boolean) => void;
  onSelectedSpaceIdsChange: (spaceIds: string[]) => void;
  onCarryContextChange: (enabled: boolean) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 180;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [props.draft, props.conversationId]);

  return (
    <div className="shrink-0 border-t bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-4/5 max-w-4xl">
        <ContextaAiAttachments
          attachments={props.attachments}
          onRemoveAttachment={props.onRemoveAttachment}
        />

        <InputGroup>
          <InputGroupTextarea
            ref={textareaRef}
            placeholder="你可以问我任何问题..."
            value={props.draft}
            onChange={(e) => props.onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void props.onSend();
              }
            }}
            className={cn('min-h-14 pr-2', 'text-base md:text-sm')}
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              size="icon-xs"
              variant="outline"
              className="rounded-full"
              aria-label="上传文件"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4" />
            </InputGroupButton>

            <ContextaAiSourcesMenu
              spaces={props.spaces}
              internetEnabled={props.internetEnabled}
              spaceEnabled={props.spaceEnabled}
              selectedSpaceIds={props.selectedSpaceIds}
              carryContext={props.carryContext}
              onInternetEnabledChange={props.onInternetEnabledChange}
              onSpaceEnabledChange={props.onSpaceEnabledChange}
              onSelectedSpaceIdsChange={props.onSelectedSpaceIdsChange}
              onCarryContextChange={props.onCarryContextChange}
            />

            <InputGroupText className="ml-auto hidden sm:flex text-xs">发送</InputGroupText>
            <Separator orientation="vertical" className="!h-4" />

            {props.loading ? (
              <InputGroupButton
                size="icon-sm"
                variant="secondary"
                aria-label="停止"
                onClick={props.onStop}
              >
                <StopCircleIcon className="h-4 w-4" />
              </InputGroupButton>
            ) : (
              <InputGroupButton
                variant={props.canSend ? 'default' : 'secondary'}
                className="rounded-full"
                aria-label="发送"
                size="icon-xs"
                disabled={!props.canSend}
                onClick={() => void props.onSend()}
              >
                <ArrowUpIcon />
                <span className="sr-only">发送</span>
              </InputGroupButton>
            )}
          </InputGroupAddon>
        </InputGroup>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            props.onFilesSelected(e.target.files);
            e.currentTarget.value = '';
          }}
        />
      </div>
    </div>
  );
}
