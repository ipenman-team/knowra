'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { HomeSidebar } from '@/components/sidebar';
import { usePageStoreSync } from '@/hooks';
import { usePageSelectionStore } from '@/stores';

import { ContextaAiSidebar } from '@/features/contexta-ai/contexta-ai-sidebar';
import { ContextaAiContent } from '@/features/contexta-ai/contexta-ai-content';

import type { ContextaAiConversation } from '@/features/contexta-ai/types';
import { contextaAiApi } from '@/lib/api';
import { ContainerLayout } from '@/components/layout/container-layout';
import { toast } from 'sonner';

type UiConversation = ContextaAiConversation & {
  messagesLoaded?: boolean;
  messagesLoading?: boolean;
};

function toEpochMs(x: unknown): number {
  const d = typeof x === 'string' || x instanceof Date ? new Date(x) : null;
  const ms = d ? d.getTime() : NaN;
  return Number.isFinite(ms) ? ms : Date.now();
}

export default function ContextaAiContainer() {
  usePageStoreSync();

  const setSelectedView = usePageSelectionStore((s) => s.setSelectedView);

  useEffect(() => {
    setSelectedView('contexta-ai');
  }, [setSelectedView]);

  const [conversations, setConversations] = useState<UiConversation[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const messageReqSeqRef = useRef(0);
  const messageReqByConversationRef = useRef(new Map<string, number>());
  const loadedConversationsRef = useRef(new Set<string>());

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  // Load conversations list on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const list = await contextaAiApi.listConversations({ limit: 50 });
      if (cancelled) return;

      setConversations((prev) => {
        const byId = new Map(prev.map((c) => [c.id, c] as const));
        return list.map((c) => {
          const existed = byId.get(c.id);
          return {
            id: c.id,
            title: c.title,
            pinned: existed?.pinned ?? false,
            draft: existed?.draft ?? '',
            messages: existed?.messages ?? [],
            messagesLoaded: existed?.messagesLoaded ?? false,
            messagesLoading: false,
            createdAt: toEpochMs(c.createdAt),
            updatedAt: toEpochMs(c.updatedAt),
          } satisfies UiConversation;
        });
      });

      setActiveId((prev) => prev || list[0]?.id || '');
    })().catch(() => {
      // Keep empty state; errors are handled by global API client.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load messages for active conversation
  useEffect(() => {
    const id = active?.id;
    if (!id) return;

    // Check if already loaded/loading using ref to avoid re-renders
    if (loadedConversationsRef.current.has(id)) return;

    // Mark as loading in ref to prevent duplicate requests
    loadedConversationsRef.current.add(id);

    let cancelled = false;

    const reqId = ++messageReqSeqRef.current;
    messageReqByConversationRef.current.set(id, reqId);

    (async () => {
      // Set loading state in async context
      setConversations((prev) => {
        const found = prev.find((c) => c.id === id);
        if (!found || found.messagesLoading || found.messagesLoaded) {
          return prev;
        }
        return prev.map((c) =>
          c.id === id ? { ...c, messagesLoading: true } : c,
        );
      });

      const messages = await contextaAiApi.listMessages(id, { limit: 200 });
      if (cancelled) return;
      if (messageReqByConversationRef.current.get(id) !== reqId) return;

      const mapped = messages
        .map((m) => {
          const role =
            m.role === 'ASSISTANT'
              ? 'assistant'
              : m.role === 'USER'
                ? 'user'
                : null;
          if (!role) return null;
          return { role, content: m.content } as const;
        })
        .filter(Boolean);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                messages: mapped as UiConversation['messages'],
                messagesLoaded: true,
                messagesLoading: false,
              }
            : c,
        ),
      );
    })().catch(() => {
      if (cancelled) return;
      if (messageReqByConversationRef.current.get(id) !== reqId) return;
      // Remove from loaded set on error so it can be retried
      loadedConversationsRef.current.delete(id);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, messagesLoaded: false, messagesLoading: false }
            : c,
        ),
      );
    });

    return () => {
      cancelled = true;

      // If this request is still the latest for the conversation, unblock UI.
      if (messageReqByConversationRef.current.get(id) === reqId) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, messagesLoading: false } : c)),
        );
      }
    };
  }, [active?.id]);

  async function handleNewConversation() {
    const created = await contextaAiApi.createConversation();
    const next: UiConversation = {
      id: created.id,
      title: created.title,
      pinned: false,
      draft: '',
      messages: [],
      messagesLoaded: true,
      messagesLoading: false,
      createdAt: toEpochMs(created.createdAt),
      updatedAt: toEpochMs(created.updatedAt),
    };

    setConversations((prev) => [next, ...prev]);
    setActiveId(created.id);
  }

  function handleSelectConversation(id: string) {
    setActiveId(id);
  }

  function handleRenameConversation(id: string, title: string) {
    const nextTitle = title.trim() || '未命名对话';
    const existed = conversations.find((c) => c.id === id);
    const prevTitle = existed?.title ?? '';
    const prevUpdatedAt = existed?.updatedAt ?? Date.now();

    if (prevTitle === nextTitle) return;

    // Optimistic update
    updateConversation(id, (c) => ({
      ...c,
      title: nextTitle,
      updatedAt: Date.now(),
    }));

    void (async () => {
      try {
        const updated = await contextaAiApi.renameConversation(id, {
          title: nextTitle,
        });
        updateConversation(id, (c) => ({
          ...c,
          title: updated.title,
          updatedAt: toEpochMs(updated.updatedAt),
        }));
      } catch {
        // Rollback on error; global API client handles user-facing errors.
        updateConversation(id, (c) => ({
          ...c,
          title: prevTitle,
          updatedAt: prevUpdatedAt,
        }));
      }
    })();
  }

  function handleTogglePinConversation(id: string) {
    updateConversation(id, (c) => ({
      ...c,
      pinned: !c.pinned,
      updatedAt: Date.now(),
    }));
  }

  async function handleDeleteConversation(id: string) {
    await contextaAiApi.deleteConversation(id);

    loadedConversationsRef.current.delete(id);
    messageReqByConversationRef.current.delete(id);

    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setActiveId((prevActive) =>
        prevActive === id ? next[0]?.id ?? '' : prevActive,
      );
      return next;
    });

    toast.success('对话已删除');
  }

  function updateConversation(
    id: string,
    updater: (prev: ContextaAiConversation) => ContextaAiConversation,
  ) {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  return (
      <div className="flex h-full min-h-0 overflow-hidden">
        <ContainerLayout
          stateId="contexta-ai"
          defaultWidthRem={18}
          className="h-full min-h-0 overflow-hidden bg-transparent"
          insetClassName="min-h-0 overflow-hidden"
          sidebar={
            <ContextaAiSidebar
              conversations={conversations}
              activeId={active?.id ?? ''}
              onNewConversation={handleNewConversation}
              onSelectConversation={handleSelectConversation}
              onRenameConversation={handleRenameConversation}
              onTogglePinConversation={handleTogglePinConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          }
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {active ? (
              <ContextaAiContent
                key={active.id}
                conversationId={active.id}
                title={active.title}
                messages={active.messages}
                draft={active.draft}
                onDraftChange={(draft) =>
                  updateConversation(active.id, (c) => ({ ...c, draft }))
                }
                onSetTitle={(title) => {
                  updateConversation(active.id, (c) => ({ ...c, title }));
                  handleRenameConversation(active.id, title);
                }}
                onSetMessages={(messages) =>
                  updateConversation(active.id, (c) => ({
                    ...c,
                    messages,
                    updatedAt: Date.now(),
                  }))
                }
              />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                暂无对话，请先新建一个对话。
              </div>
            )}
          </div>
        </ContainerLayout>
      </div>
  );
}
