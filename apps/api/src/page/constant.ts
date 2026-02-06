export const PageActivityAction = {
	Create: 'page.create',
	Rename: 'page.rename',
	Publish: 'page.publish',
	Delete: 'page.delete',
} as const;

export const PAGE_ACTIVITY_ACTION_NAME_MAP: Record<string, string> = {
	[PageActivityAction.Create]: '新建页面',
	[PageActivityAction.Rename]: '重命名页面',
	[PageActivityAction.Publish]: '发布页面',
	[PageActivityAction.Delete]: '删除页面',
};

