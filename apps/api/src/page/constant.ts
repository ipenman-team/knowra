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
        text: '✨ Contexta 编辑器插件示例',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '此默认文档覆盖当前已支持的主要插件，便于初始化后直接体验。',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '1) 标题与正文',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '这是正文段落（Paragraph）。',
      },
    ],
  },
  {
    type: 'heading-one',
    children: [
      {
        text: '这是标题 1',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '这是标题 2',
      },
    ],
  },
  {
    type: 'heading-three',
    children: [
      {
        text: '这是标题 3',
      },
    ],
  },
  {
    type: 'heading-four',
    children: [
      {
        text: '这是标题 4',
      },
    ],
  },
  {
    type: 'heading-five',
    children: [
      {
        text: '这是标题 5',
      },
    ],
  },
  {
    type: 'heading-six',
    children: [
      {
        text: '这是标题 6',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '2) 行内样式（加粗 / 斜体 / 下划线 / 文字颜色 / 背景色 / 字号 / Emoji）',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '支持 ',
      },
      {
        text: '加粗',
        bold: true,
      },
      {
        text: '、',
      },
      {
        text: '斜体',
        italic: true,
      },
      {
        text: '、',
      },
      {
        text: '下划线',
        underline: true,
      },
      {
        text: '、',
      },
      {
        text: '文字颜色',
        textColor: '#2563eb',
      },
      {
        text: '、',
      },
      {
        text: '背景高亮',
        backgroundColor: '#fde68a',
      },
      {
        text: '、',
      },
      {
        text: '大字号',
        fontSize: '24px',
      },
      {
        text: '，以及 Emoji 😄🚀',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '3) 链接',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '访问 ',
      },
      {
        type: 'link',
        url: 'https://www.baidu.com',
        pluginScope: 'inline',
        pluginKind: 'link',
        children: [
          {
            text: '百度',
          },
        ],
      },
      {
        text: ' 或 ',
      },
      {
        type: 'link',
        url: 'https://www.github.com',
        pluginScope: 'inline',
        pluginKind: 'link',
        children: [
          {
            text: 'GitHub',
          },
        ],
      },
      {
        text: '。',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '4) 对齐方式',
      },
    ],
  },
  {
    type: 'paragraph',
    align: 'center',
    children: [
      {
        text: '这是一段居中对齐文本。',
      },
    ],
  },
  {
    type: 'paragraph',
    align: 'right',
    children: [
      {
        text: '这是一段右对齐文本。',
      },
    ],
  },
  {
    type: 'paragraph',
    align: 'justify',
    children: [
      {
        text: '这是一段两端对齐文本。用于展示段落排版效果，在宽度变化时可以看到更明显的对齐差异。',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '5) 列表',
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
            text: '无序列表项 A',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: '无序列表项 B',
          },
        ],
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
            text: '有序列表项 1',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: '有序列表项 2',
          },
        ],
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '6) 引用块',
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
            text: '这是引用内容：把重要信息放进引用块，增强可读性。',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '引用内按回车可继续同一引用块。',
          },
        ],
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '7) 代码块（CodeMirror）',
      },
    ],
  },
  {
    type: 'code-block',
    pluginScope: 'block',
    pluginKind: 'code-block',
    language: 'typescript',
    wrap: true,
    lineNumbers: true,
    height: 140,
    code: `type User = { id: string; name: string };

const users: User[] = [{ id: "u_1", name: "Contexta" }];

export function findUser(id: string) {
  return users.find((item) => item.id === id) ?? null;
}`,
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
        text: '8) 文本绘图（Mermaid）',
      },
    ],
  },
  {
    type: 'diagram-block',
    pluginScope: 'block',
    pluginKind: 'diagram-block',
    engine: 'mermaid',
    templateId: 'flow-basic',
    preview: true,
    code: `flowchart TD
    A[开始] --> B{是否继续?}
    B -->|是| C[执行]
    C --> D[结束]
    B -->|否| D`,
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
        text: '9) 图片',
      },
    ],
  },
  {
    type: 'image-block',
    pluginScope: 'block',
    pluginKind: 'image-block',
    url: 'https://picsum.photos/1200/420',
    alt: '示例图片',
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
        text: '10) 表格',
      },
    ],
  },
  {
    type: 'table-block',
    pluginScope: 'block',
    pluginKind: 'table-block',
    children: [
      {
        type: 'table-row',
        height: 34,
        children: [
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: '姓名',
                    bold: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: '角色',
                    bold: true,
                  },
                ],
              },
            ],
          },
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: '备注',
                    bold: true,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'table-row',
        height: 34,
        children: [
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Alice',
                  },
                ],
              },
            ],
          },
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Editor',
                  },
                ],
              },
            ],
          },
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: '支持 Emoji 😄 与链接 ',
                  },
                  {
                    type: 'link',
                    url: 'https://www.example.com',
                    pluginScope: 'inline',
                    pluginKind: 'link',
                    children: [
                      {
                        text: '示例',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'table-row',
        height: 34,
        children: [
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Bob',
                  },
                ],
              },
            ],
          },
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: 'Viewer',
                  },
                ],
              },
            ],
          },
          {
            type: 'table-cell',
            width: 170,
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: '可继续插入文本、图片等插件',
                  },
                ],
              },
            ],
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
