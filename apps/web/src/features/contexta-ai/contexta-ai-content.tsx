'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { contextaAiApi } from '@/lib/api';

import type { ContextaAiMessage } from '@/features/contexta-ai/types';
import { useSpaceStore, useSpaces } from '@/stores';

import { ContextaAiHeader } from '@/features/contexta-ai/components/contexta-ai-header';
import { ContextaAiEmptyState } from '@/features/contexta-ai/components/contexta-ai-empty-state';
import { ContextaAiMessageList } from '@/features/contexta-ai/components/contexta-ai-message-list';
import { ContextaAiComposer } from '@/features/contexta-ai/components/contexta-ai-composer';
import { hasAbortName } from '@/features/contexta-ai/components/utils';

function normalizeSpaceIds(spaceIds: unknown): string[] {
  if (!Array.isArray(spaceIds)) return [];
  const uniq = new Set<string>();
  for (const raw of spaceIds) {
    if (typeof raw !== 'string') continue;
    const v = raw.trim();
    if (!v) continue;
    uniq.add(v);
  }
  return Array.from(uniq);
}

export function ContextaAiContent(props: {
  conversationId: string;
  title: string;
  messages: ContextaAiMessage[];
  draft: string;
  onDraftChange: (draft: string) => void;
  onSetMessages: (messages: ContextaAiMessage[]) => void;
  onSetTitle: (title: string) => void;
}) {
  const spaces = useSpaces();
  const ensureSpacesLoaded = useSpaceStore((s) => s.ensureLoaded);

  const [internetEnabled, setInternetEnabled] = useState(true);
  const [spaceEnabled, setSpaceEnabled] = useState(true);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>([]);
  const [carryContext, setCarryContext] = useState(true);

  const sourcesLoadedRef = useRef(false);
  const sourcesSaveTimerRef = useRef<number | null>(null);
  const lastSavedSourcesRef = useRef<string>('');

  useEffect(() => {
    void ensureSpacesLoaded();
  }, [ensureSpacesLoaded]);

  useEffect(() => {
    sourcesLoadedRef.current = false;
    if (sourcesSaveTimerRef.current) {
      window.clearTimeout(sourcesSaveTimerRef.current);
      sourcesSaveTimerRef.current = null;
    }

    let cancelled = false;
    (async () => {
      try {
        const cfg = await contextaAiApi.getConversationSources(
          props.conversationId,
        );
        if (cancelled) return;

        const next = {
          internetEnabled: Boolean(cfg.internetEnabled),
          spaceEnabled:
            cfg.spaceEnabled === undefined ? true : Boolean(cfg.spaceEnabled),
          spaceIds: normalizeSpaceIds(cfg.spaceIds),
          carryContext:
            cfg.carryContext === undefined ? true : Boolean(cfg.carryContext),
        };

        setInternetEnabled(next.internetEnabled);
        setSpaceEnabled(next.spaceEnabled);
        setSelectedSpaceIds(next.spaceIds);
        setCarryContext(next.carryContext);

        lastSavedSourcesRef.current = JSON.stringify(next);
      } catch {
        if (cancelled) return;

        const fallback = {
          internetEnabled: true,
          spaceEnabled: true,
          spaceIds: [],
          carryContext: true,
        };
        setInternetEnabled(fallback.internetEnabled);
        setSpaceEnabled(fallback.spaceEnabled);
        setSelectedSpaceIds(fallback.spaceIds);
        setCarryContext(fallback.carryContext);
        lastSavedSourcesRef.current = JSON.stringify(fallback);
      } finally {
        if (!cancelled) sourcesLoadedRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
      if (sourcesSaveTimerRef.current) {
        window.clearTimeout(sourcesSaveTimerRef.current);
        sourcesSaveTimerRef.current = null;
      }
    };
  }, [props.conversationId]);

  async function persistSourcesNow(): Promise<void> {
    if (!sourcesLoadedRef.current) return;
    if (sourcesSaveTimerRef.current) {
      window.clearTimeout(sourcesSaveTimerRef.current);
      sourcesSaveTimerRef.current = null;
    }

    const payload = {
      internetEnabled,
      spaceEnabled,
      spaceIds: normalizeSpaceIds(selectedSpaceIds),
      carryContext,
    };
    const key = JSON.stringify(payload);
    if (key === lastSavedSourcesRef.current) return;

    const saved = await contextaAiApi.updateConversationSources(
      props.conversationId,
      payload,
    );
    lastSavedSourcesRef.current = JSON.stringify({
      internetEnabled: Boolean(saved.internetEnabled),
      spaceEnabled: Boolean(saved.spaceEnabled),
      spaceIds: normalizeSpaceIds(saved.spaceIds),
      carryContext: Boolean(saved.carryContext),
    });
  }

  useEffect(() => {
    if (!sourcesLoadedRef.current) return;

    const payload = {
      internetEnabled,
      spaceEnabled,
      spaceIds: normalizeSpaceIds(selectedSpaceIds),
      carryContext,
    };
    const key = JSON.stringify(payload);
    if (key === lastSavedSourcesRef.current) return;

    if (sourcesSaveTimerRef.current) {
      window.clearTimeout(sourcesSaveTimerRef.current);
    }
    sourcesSaveTimerRef.current = window.setTimeout(() => {
      void persistSourcesNow().catch(() => {
        // Best-effort; ignore persistence errors here.
      });
    }, 300);

    return () => {
      if (sourcesSaveTimerRef.current) {
        window.clearTimeout(sourcesSaveTimerRef.current);
        sourcesSaveTimerRef.current = null;
      }
    };
  }, [internetEnabled, spaceEnabled, selectedSpaceIds, carryContext, props.conversationId]);
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const answerRef = useRef<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;

      if (copiedTimerRef.current) {
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
    };
  }, []);

  const canSend = useMemo(
    () => props.draft.trim().length > 0 && !loading,
    [props.draft, loading],
  );

  useEffect(() => {
    // When switching conversations, reset transient request state.
    abortRef.current?.abort();
    abortRef.current = null;
    setSubmittedQuestion(null);
    setError(null);
    setLoading(false);
    setAttachments([]);
    setCopied(false);
  }, [props.conversationId]);

  useEffect(() => {
    // Best-effort scroll to bottom when messages update.
    const el = scrollAreaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [props.messages.length, loading]);

  function handleStop() {
    if (!loading) return;
    abortRef.current?.abort();
    abortRef.current = null;
  }

  function upsertAssistant(
    messages: ContextaAiMessage[],
    content: string,
  ): ContextaAiMessage[] {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      return [...messages.slice(0, -1), { role: 'assistant', content }];
    }
    return [...messages, { role: 'assistant', content }];
  }

  async function sendQuestion(
    q: string,
    options?: { updateInput?: boolean },
  ): Promise<boolean> {
    const question = q.trim();
    if (!question || loading) return false;

    try {
      await persistSourcesNow();
    } catch (e) {
      const message = e instanceof Error ? e.message : '保存信息源设置失败';
      setError(message);
      return false;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSubmittedQuestion(question);
    if (options?.updateInput !== false) props.onDraftChange('');
    setError(null);
    setLoading(true);
    answerRef.current = '';

    const shouldSetTitle =
      props.messages.length === 0 || props.title === '新对话';
    if (shouldSetTitle) {
      const nextTitle =
        question.length > 18 ? question.slice(0, 18) + '…' : question;
      props.onSetTitle(nextTitle);
    }

    const baseMessages: ContextaAiMessage[] = [
      ...props.messages,
      { role: 'user', content: question },
    ];
    // Do not pre-insert an empty assistant message; only show a bubble when data arrives.
    props.onSetMessages(baseMessages);

    let attachmentIds: string[] = [];
    if (attachments.length > 0) {
      try {
        const upload = await contextaAiApi.uploadAttachments({
          conversationId: props.conversationId,
          files: attachments,
        });
        attachmentIds = upload.attachments.map((a) => a.id);
      } catch (e) {
        const message = e instanceof Error ? e.message : '附件上传失败';
        setError(message);
        setLoading(false);
        abortRef.current = null;
        answerRef.current = null;
        return false;
      }
    }

    try {
      await contextaAiApi.chatStream(
        {
          conversationId: props.conversationId,
          message: question,
          attachmentIds,
        },
        {
          onDelta: (delta) => {
            props.onSetMessages(
              upsertAssistant(baseMessages, (answerRef.current ?? '') + delta),
            );
            answerRef.current = (answerRef.current ?? '') + delta;
          },
        },
        { signal: controller.signal },
      );
      return true;
    } catch (e) {
      if (
        (e instanceof DOMException && e.name === 'AbortError') ||
        (hasAbortName(e) && e.name === 'AbortError')
      ) {
        return false;
      }
      const message = e instanceof Error ? e.message : '请求失败';
      setError(message);
      // Keep the user question in history; append a short assistant error.
      props.onSetMessages(
        upsertAssistant(baseMessages, `请求失败：${message}`),
      );
      return false;
    } finally {
      setLoading(false);
      abortRef.current = null;
      answerRef.current = null;
    }
  }

  async function handleSend() {
    const q = props.draft.trim();
    if (!q || loading) return;

    const ok = await sendQuestion(q, { updateInput: true });
    if (ok) setAttachments([]);
  }

  async function handleRetry() {
    if (!submittedQuestion || loading) return;
    await sendQuestion(submittedQuestion, { updateInput: false });
  }

  async function handleRegenerate() {
    if (loading) return;
    const lastUser = [...props.messages]
      .reverse()
      .find((m) => m.role === 'user')?.content;
    if (!lastUser) return;
    // Remove trailing assistant message before regenerating.
    const trimmed =
      props.messages.length > 0 &&
      props.messages[props.messages.length - 1]?.role === 'assistant'
        ? props.messages.slice(0, -1)
        : props.messages;
    props.onSetMessages(trimmed);
    await sendQuestion(lastUser, { updateInput: false });
  }

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const next = Array.from(fileList);
    setAttachments((prev) => {
      const merged = [...prev];
      for (const f of next) {
        if (!merged.some((x) => x.name === f.name && x.size === f.size)) {
          merged.push(f);
        }
      }
      return merged;
    });
  }

  function handleRemoveAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleShare() {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (
          navigator as unknown as {
            share: (d: { title?: string; url?: string }) => Promise<void>;
          }
        ).share({
          title: props.title,
          url,
        });
        return;
      }
    } catch {
      // Ignore and fallback to copy.
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedTimerRef.current = null;
      }, 1500);
    } catch {
      // If clipboard fails, do nothing.
    }
  }

  const inAnswerMode = props.messages.length > 0 || submittedQuestion !== null;

  const showRegenerate =
    !loading &&
    props.messages.some(
      (m) => m.role === 'assistant' && m.content.trim().length > 0,
    );

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <ContextaAiHeader title={props.title} copied={copied} onShare={handleShare} />

      <div
        ref={scrollAreaRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {inAnswerMode ? (
          <ContextaAiMessageList
            messages={props.messages}
            loading={loading}
            error={error}
            showRegenerate={showRegenerate}
            onRetry={handleRetry}
            onRegenerate={handleRegenerate}
          />
        ) : (
          <ContextaAiEmptyState />
        )}
      </div>

      <ContextaAiComposer
        conversationId={props.conversationId}
        draft={props.draft}
        onDraftChange={props.onDraftChange}
        canSend={canSend}
        loading={loading}
        onSend={handleSend}
        onStop={handleStop}
        attachments={attachments}
        onFilesSelected={handleFilesSelected}
        onRemoveAttachment={handleRemoveAttachment}
        spaces={spaces}
        internetEnabled={internetEnabled}
        spaceEnabled={spaceEnabled}
        selectedSpaceIds={selectedSpaceIds}
        carryContext={carryContext}
        onInternetEnabledChange={setInternetEnabled}
        onSpaceEnabledChange={setSpaceEnabled}
        onSelectedSpaceIdsChange={setSelectedSpaceIds}
        onCarryContextChange={setCarryContext}
      />
    </div>
  );
}
