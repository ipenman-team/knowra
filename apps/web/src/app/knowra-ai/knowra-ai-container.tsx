'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { usePageStoreSync } from '@/hooks';
import { usePageSelectionStore } from '@/stores';

import { KnowraAiSidebar } from '@/features/knowra-ai/knowra-ai-sidebar';
import { KnowraAiContent } from '@/features/knowra-ai/knowra-ai-content';

import type { KnowraAiConversation } from '@/features/knowra-ai/types';
import { knowraAiApi } from '@/lib/api';
import { ContainerLayout } from '@/components/layout/container-layout';
import { toast } from 'sonner';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';
import { BotIcon } from '@/components/icon/bot.icon';
import { PlusIcon } from 'lucide-react';
import { KnowraAiEmptyState } from '@/features/knowra-ai/components/knowra-ai-empty-state';

type UiConversation = KnowraAiConversation & {
  messagesLoaded?: boolean;
  messagesLoading?: boolean;
};

function toEpochMs(x: unknown): number {
  const d = typeof x === 'string' || x instanceof Date ? new Date(x) : null;
  const ms = d ? d.getTime() : NaN;
  return Number.isFinite(ms) ? ms : Date.now();
}

export default function KnowraAiContainer() {
  usePageStoreSync();

  const setSelectedView = usePageSelectionStore((s) => s.setSelectedView);

  useEffect(() => {
    setSelectedView('knowra-ai');
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
  const hasConversations = conversations.length > 0;

  // Load conversations list on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const list = await knowraAiApi.listConversations({ limit: 50 });
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

      const messages = await knowraAiApi.listMessages(id, { limit: 200 });
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
    const created = await knowraAiApi.createConversation();
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
        const updated = await knowraAiApi.renameConversation(id, {
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
    await knowraAiApi.deleteConversation(id);

    loadedConversationsRef.current.delete(id);
    messageReqByConversationRef.current.delete(id);

    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setActiveId((prevActive) =>
        prevActive === id ? (next[0]?.id ?? '') : prevActive,
      );
      return next;
    });

    toast.success('对话已删除');
  }

  function updateConversation(
    id: string,
    updater: (prev: KnowraAiConversation) => KnowraAiConversation,
  ) {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <ContainerLayout
        stateId="knowra-ai"
        defaultWidthRem={18}
        className="h-full min-h-0 overflow-hidden bg-transparent"
        insetClassName="min-h-0 overflow-hidden"
        sidebar={
          hasConversations ? (
            <KnowraAiSidebar
              conversations={conversations}
              activeId={active?.id ?? ''}
              onNewConversation={handleNewConversation}
              onSelectConversation={handleSelectConversation}
              onRenameConversation={handleRenameConversation}
              onTogglePinConversation={handleTogglePinConversation}
              onDeleteConversation={handleDeleteConversation}
            />
          ) : null
        }
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {active ? (
            <KnowraAiContent
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
            <KnowraAiEmptyState
              EmptyContent={
                <>
                  <div className="m-1 text-gray-500">开始你的第一个对话</div>
                  <div>
                    <Button type="button" onClick={handleNewConversation}>
                      <PlusIcon className="h-4 w-4" />
                      创建对话
                    </Button>
                  </div>
                </>
              }
            />
          )}
        </div>
      </ContainerLayout>
    </div>
  );
}
