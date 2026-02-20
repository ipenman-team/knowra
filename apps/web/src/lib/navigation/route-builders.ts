/**
 * 路由 URL 构建器
 *
 * 职责：
 * 1. 统一 URL 编码规则
 * 2. 集中管理 URL 结构
 * 3. 确保 URL 格式一致性
 *
 * NOTE: 所有动态参数（spaceId, pageId）自动使用 encodeURIComponent 编码
 */

import type { NavigationView, PageMode } from './types';

/**
 * 构建空间主页 URL
 *
 * @param spaceId - 空间 ID（自动编码）
 * @returns /spaces/{encodedSpaceId}
 *
 * @example
 * buildSpaceUrl('my-space') → '/spaces/my-space'
 * buildSpaceUrl('space/with/slash') → '/spaces/space%2Fwith%2Fslash'
 */
export function buildSpaceUrl(spaceId: string): string {
  return `/spaces/${encodeURIComponent(spaceId)}`;
}

/**
 * 构建页面 URL
 *
 * @param spaceId - 空间 ID（自动编码）
 * @param pageId - 页面 ID（自动编码）
 * @returns /spaces/{encodedSpaceId}/pages/{encodedPageId}
 *
 * @example
 * buildPageUrl('space-1', 'page-123')
 *   → '/spaces/space-1/pages/page-123'
 */
export function buildPageUrl(
  spaceId: string,
  pageId: string,
  options?: { mode?: PageMode },
): string {
  const baseUrl = `/spaces/${encodeURIComponent(spaceId)}/pages/${encodeURIComponent(pageId)}`;
  if (!options?.mode) return baseUrl;

  const search = new URLSearchParams({
    mode: options.mode,
  });
  return `${baseUrl}?${search.toString()}`;
}

/**
 * 构建主视图 URL
 *
 * @param view - 视图类型
 * @returns /workbench | /knowra-ai | /settings
 *
 * @example
 * buildViewUrl('workbench') → '/workbench'
 * buildViewUrl('knowra-ai') → '/knowra-ai'
 */
export function buildViewUrl(view: NavigationView): string {
  return `/${view}`;
}

/**
 * 构建回收站 URL
 *
 * @returns /spaces/trash
 */
export function buildTrashUrl(): string {
  return '/spaces/trash';
}

/**
 * 构建页面历史版本 URL
 *
 * @param pageId - 页面 ID（自动编码）
 * @returns /pages/{encodedPageId}/versions
 *
 * @example
 * buildPageVersionsUrl('page-123') → '/pages/page-123/versions'
 */
export function buildPageVersionsUrl(pageId: string): string {
  return `/pages/${encodeURIComponent(pageId)}/versions`;
}
