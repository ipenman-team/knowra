export const PageActivityAction = {
  Create: 'page.create',
  Rename: 'page.rename',
  Publish: 'page.publish',
  Delete: 'page.delete',
  Restore: 'page.restore',
  Purge: 'page.purge',
} as const;

export const PAGE_ACTIVITY_ACTION_NAME_MAP: Record<string, string> = {
  [PageActivityAction.Create]: '新建页面',
  [PageActivityAction.Rename]: '重命名页面',
  [PageActivityAction.Publish]: '发布页面',
  [PageActivityAction.Delete]: '删除页面',
  [PageActivityAction.Restore]: '恢复页面',
  [PageActivityAction.Purge]: '彻底删除页面',
};

export const DefaultPageTitle = '首页';

export const DefaultPageContent = [
  {
    type: 'heading-one',
    children: [
      {
        text: '👋 欢迎来到「Contexta」',
      },
    ],
  },
  {
    type: 'heading-one',
    children: [
      {
        text: '',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '你可以做什么❓',
      },
    ],
  },
  {
    type: 'bulleted-list',
    children: [
      {
        type: 'list-item',
        children: [
          {
            text: '创建页面并用富文本编辑（标题、列表、引用、样式标记等）',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: '导入 PDF / Word，自动生成可编辑文档',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: '对文档进行检索与问答（RAG）',
          },
        ],
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '🏷️ 样式标记（加粗 / 斜体 / 下划线）',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '支持',
      },
      {
        bold: true,
        text: '加粗',
      },
      {
        text: '、',
      },
      {
        text: '斜体',
        italic: true,
      },
      {
        text: ' 与 ',
      },
      {
        text: '下划线',
        underline: true,
      },
      {
        text: '。',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '🧾 引用块',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            text: '把重要的信息放进引用块，可以显著提升可读性。',
          },
        ],
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '建议的下一步🦶',
      },
    ],
  },
  {
    type: 'numbered-list',
    children: [
      {
        type: 'list-item',
        children: [
          {
            text: '在空间里创建第一篇文档',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: '导入一份 PDF/Word，看看转换效果',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: '尝试向 AI 提问，并引用文档内容作答',
          },
        ],
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '',
      },
    ],
  },
];
