import {
  markdownToSlateValue,
  slateToPlainText,
} from '@knowra/slate-converters';

describe('markdownToSlateValue inline parsing', () => {
  it('parses long text with paired backticks', () => {
    const text =
      '— 1 — https://cx.cnki.net 知网个人AIGC检测服务 https://cx.cnki.net 知网个人AIGC检测服务 AIGC检测 · 全文报告单 NO:CNKIAIGC2025FG_202507108049810 检测时间：2025-07-22 22:34:30 篇名： 国有企业财务管理转型中的业财融合实践 作者： 史伟超 单位： 文件名：0722-史伟超查重-论文-国有企业财务管理转型中的业财融合实践.docx 全文检测结果 知网AIGC检测 https://cx.cnki.net 60.6% AI特征值 AI特征值：60.6% AI特征字符数：2969 总字符数：4902 AI特征显著（计入AI特征字符数） AI特征疑似（未计入AI特征字符数） 未标识部分 AIGC片段分布图 前部20% 中部60% 后部20% AI特征值：61.0% AI特征字符数：598 AI特征值：58.0% AI特征字符数：1706 AI特征值：67.9% AI特征字符数：665 0 4902 AI特征显著 AI特征疑似 未标识部分 片段指标列表 序号 片段名称 字符数 AI特征 1 片段1 598 显著 12.2% 2 片段2 345 疑似 7.0% 3 片段3 387 疑似 7.9% 4 片段4 2371 显著 48.4% 5 片段5 312 疑似 6.4%';
    const value = markdownToSlateValue(text);
    const plain = slateToPlainText(value);
    expect(plain).toContain('https://cx.cnki.net');
  });

  it('does not hang on unmatched backtick', () => {
    const text = 'hello `https://cx.cnki.net  world';
    const value = markdownToSlateValue(text);
    const plain = slateToPlainText(value);
    expect(plain).toContain('`https://cx.cnki.net');
  });

  it('unescapes backslash-escaped punctuation', () => {
    const text = '## 2\\. 标题\n\\[1\\] 2020\\(07\\):3\\-14\\.\n';
    const value = markdownToSlateValue(text);
    const plain = slateToPlainText(value);
    expect(plain).toContain('2. 标题');
    expect(plain).toContain('[1] 2020(07):3-14.');
    expect(plain).not.toContain('\\');
  });

  it('unescapes fullwidth backslash escapes', () => {
    const text = '## 6＼. 团队管理\n（图＼(二＼)）\n';
    const value = markdownToSlateValue(text);
    const plain = slateToPlainText(value);
    expect(plain).toContain('6. 团队管理');
    expect(plain).toContain('（图(二)）');
    expect(plain).not.toContain('＼');
  });
});
