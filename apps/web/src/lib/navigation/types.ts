/**
 * 路由导航类型定义
 *
 * 职责：统一管理路由相关的类型
 */

/**
 * 主视图类型
 *
 * - workbench: 工作台
 * - knowra-ai: Knowra AI 模块
 * - favorites: 我的收藏
 * - settings: 设置页面
 */
export type NavigationView = 'workbench' | 'knowra-ai' | 'favorites' | 'settings';

/**
 * 导航选项
 */
export interface NavigationOptions {
  /**
   * 是否替换历史记录（默认 false）
   *
   * - true: 使用 router.replace()，不保留历史
   * - false: 使用 router.push()，保留历史
   */
  replace?: boolean;
}
