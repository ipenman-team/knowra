export const SpaceActivityAction = {
  Create: 'space.create',
  Update: 'space.update',
  Rename: 'space.rename',
  Favorite: 'space.favorite',
  Unfavorite: 'space.unfavorite',
  Delete: 'space.delete',
} as const;

export const SPACE_ACTIVITY_ACTION_NAME_MAP: Record<string, string> = {
  [SpaceActivityAction.Create]: '创建空间',
  [SpaceActivityAction.Update]: '修改空间',
  [SpaceActivityAction.Rename]: '重命名空间',
  [SpaceActivityAction.Favorite]: '收藏空间',
  [SpaceActivityAction.Unfavorite]: '取消收藏空间',
  [SpaceActivityAction.Delete]: '删除空间',
};
