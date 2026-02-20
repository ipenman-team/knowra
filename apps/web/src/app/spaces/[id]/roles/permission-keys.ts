export const PERMISSION_GROUPS = [
  {
    key: 'space',
    label: '空间管理',
    items: [
      { key: 'space.view', label: '查看空间' },
      { key: 'space.edit', label: '编辑空间信息' },
      { key: 'space.delete', label: '删除空间' },
      { key: 'space.archive', label: '归档空间' },
      { key: 'space.member.view', label: '查看成员' },
      { key: 'space.member.invite', label: '邀请成员' },
      { key: 'space.member.remove', label: '移除成员' },
      { key: 'space.member.role_change', label: '修改成员角色' },
      { key: 'space.role.manage', label: '管理角色' },
      { key: 'space.share.manage', label: '管理空间共享' },
    ],
  },
  {
    key: 'page',
    label: '页面操作',
    items: [
      { key: 'page.create', label: '创建页面' },
      { key: 'page.view', label: '查看页面' },
      { key: 'page.edit', label: '编辑页面' },
      { key: 'page.publish', label: '发布页面' },
      { key: 'page.delete', label: '删除页面' },
      { key: 'page.restore', label: '恢复页面' },
      { key: 'page.purge', label: '彻底删除页面' },
      { key: 'page.export', label: '导出页面' },
      { key: 'page.share.manage', label: '管理页面共享' },
      { key: 'page.import', label: '导入文档' },
    ],
  },
  {
    key: 'collaboration',
    label: '协作',
    items: [
      { key: 'comment.create', label: '发表评论' },
      { key: 'comment.delete_own', label: '删除自己的评论' },
      { key: 'comment.delete_any', label: '删除任意评论' },
      { key: 'page.like', label: '页面点赞' },
    ],
  },
  {
    key: 'rag',
    label: '知识库',
    items: [{ key: 'rag.index.manage', label: '管理知识库索引' }],
  },
] as const;

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) =>
  group.items.map((item) => item.key),
);
