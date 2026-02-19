export const PageActivityAction = {
  Create: 'page.create',
  Rename: 'page.rename',
  Publish: 'page.publish',
  Like: 'page.like',
  Unlike: 'page.unlike',
  Delete: 'page.delete',
  Restore: 'page.restore',
  Purge: 'page.purge',
} as const;

export const PAGE_ACTIVITY_ACTION_NAME_MAP: Record<string, string> = {
  [PageActivityAction.Create]: '新建页面',
  [PageActivityAction.Rename]: '重命名页面',
  [PageActivityAction.Publish]: '发布页面',
  [PageActivityAction.Like]: '点赞页面',
  [PageActivityAction.Unlike]: '取消点赞',
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
        text: '👋 欢迎来到 Contexta',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '这是你的第一篇文档。下面用几分钟带你体验常用编辑能力，你可以直接在这份内容上修改。',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '第一步：标题与正文',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '把光标放在任意一行，试试工具栏中的“正文 / 标题”切换。',
      },
    ],
  },
  {
    type: 'heading-one',
    children: [
      {
        text: '标题 1：页面主标题',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '标题 2：章节标题',
      },
    ],
  },
  {
    type: 'heading-three',
    children: [
      {
        text: '标题 3：小节标题',
      },
    ],
  },
  {
    type: 'heading-four',
    children: [
      {
        text: '标题 4：说明级标题',
      },
    ],
  },
  {
    type: 'heading-five',
    children: [
      {
        text: '标题 5：更细一级',
      },
    ],
  },
  {
    type: 'heading-six',
    children: [
      {
        text: '标题 6：最小标题',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '第二步：行内样式',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '你可以组合使用 ',
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
        text: '、字体',
      },
      {
        text: '颜色',
        textColor: '#2563eb',
      },
      {
        text: '、',
      },
      {
        text: '背景色',
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
        text: '，以及 Emoji 😄🚀。',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '第三步：插入链接',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
      {
        text: '选中文字后点击工具栏链接按钮，例如：',
      },
    ],
  },
  {
    type: 'paragraph',
    children: [
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
        text: ' · ',
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
        text: '第四步：对齐方式',
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
        text: '这是一段两端对齐文本。适合较长说明内容，阅读体验更整齐。',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '第五步：列表与引用',
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
            text: '待办：完善文档结构',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: '待办：补充关键截图',
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
            text: '第一步：先写结论',
          },
        ],
      },
      {
        type: 'list-item',
        children: [
          {
            text: '第二步：再补背景与细节',
          },
        ],
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
            text: '提示：引用块适合放“结论、注意事项、引用原文”。',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            text: '如果当前引用行为空，按回车可退出引用。',
          },
        ],
      },
    ],
  },
  {
    type: 'heading-two',
    children: [
      {
        text: '第六步：代码块（支持语言、换行、行号）',
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
    code: `type QuickStart = {
  step: number;
  title: string;
};

const steps: QuickStart[] = [
  { step: 1, title: "写标题" },
  { step: 2, title: "补正文" },
];

export function getStepTitle(step: number) {
  return steps.find((item) => item.step === step)?.title ?? "未定义";
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
        text: '第七步：文本绘图（Mermaid）',
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
    A[开始写文档] --> B{需要插图吗?}
    B -->|是| C[插入图片或图表]
    B -->|否| D[继续写正文]
    C --> E[检查排版]
    D --> E
    E --> F[发布]`,
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
        text: '第八步：图片',
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
        text: '第九步：表格',
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
                    text: '任务',
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
                    text: '负责人',
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
                    text: '说明',
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
                    text: '完善首页文案',
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
                    text: '小王',
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
                    text: '可以附上相关链接：',
                  },
                  {
                    type: 'link',
                    url: 'https://www.example.com',
                    pluginScope: 'inline',
                    pluginKind: 'link',
                    children: [
                      {
                        text: '参考文档',
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
                    text: '补充功能说明',
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
                    text: '小李',
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
                    text: '表格单元格内可继续编辑文本、emoji、链接等',
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
        text: '🎉 已完成新手引导。你可以从这里开始写自己的内容，或直接清空后重新创作。',
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
