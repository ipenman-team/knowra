/**
 * 路由 URL 解析器
 *
 * 职责：
 * 1. 从 pathname 解析路由参数
 * 2. 自动处理 URL 解码
 * 3. 提供类型安全的解析结果
 *
 * NOTE: 这些 hooks 是唯一从 URL 读取状态的地方
 * 其他组件应通过 Navigation Service 修改 URL
 */

'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type { NavigationView } from './types';

/**
 * 解析空间路由
 *
 * 从 pathname 中提取当前空间 ID
 *
 * @returns 当前空间 ID（已解码）或 null
 *
 * @example
 * pathname: /spaces/my-space-123 → "my-space-123"
 * pathname: /spaces/space%2Fwith%2Fslash → "space/with/slash"
 * pathname: /workbench → null
 * pathname: /spaces/trash → null（trash 是特殊路径）
 */
export function useSpaceRoute(): string | null {
  const pathname = usePathname();

  return useMemo(() => {
    // 匹配 /spaces/{spaceId} 或 /spaces/{spaceId}/...
    const match = pathname.match(/^\/spaces\/([^/]+)/);
    if (!match) return null;

    const encodedId = match[1];

    // 过滤特殊路径
    if (encodedId === 'trash') return null;

    return decodeURIComponent(encodedId);
  }, [pathname]);
}

/**
 * 解析页面路由
 *
 * 从 pathname 中提取当前页面 ID
 *
 * @returns 当前页面 ID（已解码）或 null
 *
 * @example
 * pathname: /spaces/space-1/pages/page-123 → "page-123"
 * pathname: /spaces/space-1/pages/page%2Fid → "page/id"
 * pathname: /spaces/space-1 → null
 */
export function usePageRoute(): string | null {
  const pathname = usePathname();

  return useMemo(() => {
    // 匹配 /spaces/{spaceId}/pages/{pageId}
    const match = pathname.match(/^\/spaces\/[^/]+\/pages\/([^/]+)/);
    if (!match) return null;

    const encodedId = match[1];
    return decodeURIComponent(encodedId);
  }, [pathname]);
}

/**
 * 解析当前视图类型
 *
 * 从 pathname 中判断当前所在的主视图
 *
 * @returns 当前视图或 null
 *
 * @example
 * pathname: /workbench → 'workbench'
 * pathname: /workbench/settings → 'workbench'
 * pathname: /knowra-ai → 'knowra-ai'
 * pathname: /spaces/123 → null
 */
export function useViewRoute(): NavigationView | null {
  const pathname = usePathname();

  return useMemo(() => {
    if (pathname === '/workbench' || pathname.startsWith('/workbench/')) {
      return 'workbench';
    }
    if (pathname === '/knowra-ai' || pathname.startsWith('/knowra-ai/')) {
      return 'knowra-ai';
    }
    if (pathname === '/favorites' || pathname.startsWith('/favorites/')) {
      return 'favorites';
    }
    if (pathname === '/settings' || pathname.startsWith('/settings/')) {
      return 'settings';
    }
    return null;
  }, [pathname]);
}

/**
 * 检查是否在回收站路由
 *
 * @returns 是否在回收站页面
 *
 * @example
 * pathname: /spaces/trash → true
 * pathname: /spaces/trash/... → true
 * pathname: /spaces/123 → false
 */
export function useIsTrashRoute(): boolean {
  const pathname = usePathname();
  return pathname === '/spaces/trash' || pathname.startsWith('/spaces/trash/');
}

/**
 * 检查是否在空间路由中（不包括回收站）
 *
 * @returns 是否在空间页面
 *
 * @example
 * pathname: /spaces/123 → true
 * pathname: /spaces/123/pages/456 → true
 * pathname: /spaces/trash → false
 * pathname: /workbench → false
 */
export function useIsSpacesRoute(): boolean {
  const pathname = usePathname();
  const isTrash = pathname === '/spaces/trash' || pathname.startsWith('/spaces/trash/');
  return pathname.startsWith('/spaces/') && !isTrash;
}
