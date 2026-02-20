/**
 * 路由导航服务
 *
 * 职责：
 * 1. 提供业务语义化的导航 API
 * 2. 处理 URL 编码（通过 route-builders）
 * 3. 决定使用 push 还是 replace
 * 4. 集中管理路由跳转逻辑
 *
 * NOTE: 这是应用中唯一允许调用 router.push/replace 的地方
 * 其他组件应通过这个 service 进行路由跳转
 */

'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import {
  buildSpaceUrl,
  buildPageUrl,
  buildViewUrl,
  buildTrashUrl,
  buildPageVersionsUrl,
} from './route-builders';
import type { NavigationView, NavigationOptions } from './types';

/**
 * 导航服务 Hook
 *
 * 提供统一的路由跳转 API
 *
 * @example
 * const { navigateToPage, navigateToSpace } = useNavigation();
 *
 * // 跳转到页面
 * navigateToPage('space-1', 'page-123');
 *
 * // 跳转到空间
 * navigateToSpace('space-1');
 */
export function useNavigation() {
  const router = useRouter();

  /**
   * 导航到空间主页
   *
   * @param spaceId - 空间 ID
   * @param options.replace - 是否替换历史记录（默认 false）
   *
   * @example
   * navigateToSpace('my-space')
   * navigateToSpace('my-space', { replace: true })
   */
  const navigateToSpace = useCallback(
    (spaceId: string, options?: NavigationOptions) => {
      const url = buildSpaceUrl(spaceId);
      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router]
  );

  /**
   * 导航到空间中的某个页面
   *
   * @param spaceId - 空间 ID
   * @param pageId - 页面 ID
   * @param options.replace - 是否替换历史记录（默认 false）
   *
   * @example
   * navigateToPage('space-1', 'page-123')
   * navigateToPage('space-1', 'page-123', { replace: true })
   */
  const navigateToPage = useCallback(
    (spaceId: string, pageId: string, options?: NavigationOptions) => {
      const url = buildPageUrl(spaceId, pageId);
      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [router]
  );

  /**
   * 导航到主视图（工作台、Knowra AI、设置）
   *
   * NOTE: 视图切换总是使用 replace，避免产生过多历史记录
   * 理由：用户在"工作台 ↔ Knowra AI"快速切换时，
   * 不应该需要多次点击返回键才能回到起点
   *
   * @param view - 视图类型
   *
   * @example
   * navigateToView('workbench')
   * navigateToView('knowra-ai')
   */
  const navigateToView = useCallback(
    (view: NavigationView) => {
      const url = buildViewUrl(view);
      router.replace(url);
    },
    [router]
  );

  /**
   * 导航到回收站
   *
   * @example
   * navigateToTrash()
   */
  const navigateToTrash = useCallback(() => {
    const url = buildTrashUrl();
    router.push(url);
  }, [router]);

  /**
   * 导航到页面历史版本
   *
   * @param pageId - 页面 ID
   *
   * @example
   * navigateToPageVersions('page-123')
   */
  const navigateToPageVersions = useCallback(
    (pageId: string) => {
      const url = buildPageVersionsUrl(pageId);
      router.push(url);
    },
    [router]
  );

  return {
    navigateToSpace,
    navigateToPage,
    navigateToView,
    navigateToTrash,
    navigateToPageVersions,
  };
}
