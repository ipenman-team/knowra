/**
 * Navigation 模块统一导出
 *
 * 提供路由管理的完整功能
 */

// 导航服务（主要 API）
export { useNavigation } from './navigation-service';

// 路由解析器（URL → 状态）
export {
  useSpaceRoute,
  usePageRoute,
  useViewRoute,
  useIsTrashRoute,
  useIsSpacesRoute,
} from './route-parsers';

// URL 构建器（用于 Link 组件）
export {
  buildSpaceUrl,
  buildPageUrl,
  buildViewUrl,
  buildTrashUrl,
  buildPageVersionsUrl,
} from './route-builders';

// 类型定义
export type { NavigationView, NavigationOptions } from './types';
