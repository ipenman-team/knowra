import { memo } from 'react';

export const EditorTitleDisplay = memo(function EditorTitleDisplay({
  title,
}: {
  title: string;
}) {
  return (
    <div className="text-5xl font-bold tracking-tight">
      {title.trim() || '无标题文档'}
    </div>
  );
});
