/**
 * 路由状态同步组件
 *
 * 职责：监听 URL 变化并同步到 Zustand stores
 *
 * NOTE: 这是唯一允许"URL → Store"同步的地方
 * 其他组件应通过 Navigation Service 直接修改 URL
 *
 * 设计决策：
 * - 只同步基本的 ID 信息（spaceId, pageId, view）
 * - 页面 title 等扩展信息由业务组件（如 directory-list）负责更新
 * - 保持轻量级，避免依赖复杂的业务数据
 */

'use client';

import { useEffect } from 'react';
import {
  useSpaceRoute,
  usePageRoute,
  useViewRoute,
} from '@/lib/navigation/route-parsers';
import { useSpaceStore } from '@/stores/space-store';
import { usePageSelectionStore } from '@/stores/page-selection-store';

export function RouteSync() {
  const currentSpaceId = useSpaceRoute();
  const currentPageId = usePageRoute();
  const currentView = useViewRoute();

  const setCurrentSpaceId = useSpaceStore((s) => s.setCurrentSpaceId);
  const setSelectedPage = usePageSelectionStore((s) => s.setSelectedPage);
  const setSelectedView = usePageSelectionStore((s) => s.setSelectedView);

  // 同步空间 ID
  useEffect(() => {
    if (currentSpaceId) {
      setCurrentSpaceId(currentSpaceId);
    }
  }, [currentSpaceId, setCurrentSpaceId]);

  // 同步页面选择
  // NOTE: title 使用空字符串，将由 directory-list 等组件在数据加载后更新
  useEffect(() => {
    if (currentPageId) {
      setSelectedPage(currentPageId, '');
    }
  }, [currentPageId, setSelectedPage]);

  // 同步视图选择
  useEffect(() => {
    if (currentView) {
      setSelectedView(currentView);
    }
  }, [currentView, setSelectedView]);

  return null; // 纯逻辑组件，不渲染 UI
}
