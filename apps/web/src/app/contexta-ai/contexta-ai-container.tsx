'use client';

import { useEffect, useMemo, useState } from 'react';

import { HomeLayout } from '@/components/layout';
import { HomeSidebar } from '@/components/sidebar';
import { usePageStoreSync } from '@/hooks';
import { usePageSelectionStore } from '@/stores';

import { ContextaAiSidebar } from '@/features/contexta-ai/contexta-ai-sidebar';
import { ContextaAiContent } from '@/features/contexta-ai/contexta-ai-content';

import type { ContextaAiConversation } from '@/features/contexta-ai/types';

function newConversation(): ContextaAiConversation {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(Date.now());
  const now = Date.now();
  return {
    id,
    title: '未命名对话',
    pinned: false,
    createdAt: now,
    updatedAt: now,
    draft: '',
    messages: [],
  };
}

export default function ContextaAiContainer() {
  usePageStoreSync();

  const setSelectedView = usePageSelectionStore((s) => s.setSelectedView);

  useEffect(() => {
    setSelectedView('contexta-ai');
  }, [setSelectedView]);

  const [conversations, setConversations] = useState<ContextaAiConversation[]>(
    () => [newConversation()],
  );
  const [activeId, setActiveId] = useState<string>(
    () => conversations[0]?.id ?? '',
  );

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  useEffect(() => {
    if (!active && conversations.length > 0) setActiveId(conversations[0]!.id);
  }, [active, conversations]);

  function handleNewConversation() {
    const created = newConversation();
    setConversations((prev) => [created, ...prev]);
    setActiveId(created.id);
  }

  function handleSelectConversation(id: string) {
    setActiveId(id);
  }

  function handleRenameConversation(id: string, title: string) {
    updateConversation(id, (c) => ({
      ...c,
      title: title.trim(),
      updatedAt: Date.now(),
    }));
  }

  function handleTogglePinConversation(id: string) {
    updateConversation(id, (c) => ({
      ...c,
      pinned: !c.pinned,
      updatedAt: Date.now(),
    }));
  }

  function updateConversation(
    id: string,
    updater: (prev: ContextaAiConversation) => ContextaAiConversation,
  ) {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  return (
    <HomeLayout sidebar={<HomeSidebar />}>
      <div className="flex h-full min-h-0 overflow-hidden">
        <ContextaAiSidebar
          conversations={conversations}
          activeId={active?.id ?? ''}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onRenameConversation={handleRenameConversation}
          onTogglePinConversation={handleTogglePinConversation}
        />

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
              onSetTitle={(title) =>
                updateConversation(active.id, (c) => ({ ...c, title }))
              }
              onSetMessages={(messages) =>
                updateConversation(active.id, (c) => ({
                  ...c,
                  messages,
                  updatedAt: Date.now(),
                }))
              }
            />
          ) : null}
        </div>
      </div>
    </HomeLayout>
  );
}
