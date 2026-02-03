import { X } from 'lucide-react';

import { formatFileSize } from './utils';

export function ContextaAiAttachments(props: {
  attachments: File[];
  onRemoveAttachment: (index: number) => void;
}) {
  if (props.attachments.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {props.attachments.map((f, idx) => (
        <div
          key={`${f.name}-${f.size}-${f.lastModified}`}
          className="group inline-flex max-w-full items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
        >
          <span className="max-w-[240px] truncate">{f.name}</span>
          <span className="text-muted-foreground">{formatFileSize(f.size)}</span>
          <button
            type="button"
            aria-label={`移除附件 ${f.name}`}
            className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            onClick={() => props.onRemoveAttachment(idx)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
