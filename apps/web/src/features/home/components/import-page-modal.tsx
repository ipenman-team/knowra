'use client';

import { useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WordIcon } from '@/components/icon/word';
import { PdfIcon } from '@/components/icon/pdf';
import { MarkdownIcon } from '@/components/icon/markdown';

type ImportType = 'markdown' | 'pdf' | 'docx';

type ImportOption = {
  id: string;
  label: string;
  icon: React.ReactNode;
  extensions: string;
  enabled: boolean;
  type: ImportType | null;
};

function OptionCard(props: {
  option: ImportOption;
  onSelect?: () => void;
}) {
  const { option, onSelect } = props;

  return (
    <button
      type="button"
      className={cn(
        'group flex w-full flex-col items-center gap-2 rounded-lg p-3 text-left',
        option.enabled ? 'hover:bg-accent' : 'opacity-40',
      )}
      disabled={!option.enabled}
      onClick={onSelect}
    >
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-xl bg-background',
        )}
        aria-hidden
      >
        {option.icon}
      </div>
      <div className="text-center">
        <div className="text-sm font-medium">{option.label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {option.extensions}
        </div>
      </div>
    </button>
  );
}

export function ImportPageModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickMarkdownFile: (file: File) => void;
  onPickPdfFile: (file: File) => void;
  onPickDocxFile: (file: File) => void;
}) {
  const [selected, setSelected] = useState<ImportType | null>('markdown');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const docxInputRef = useRef<HTMLInputElement | null>(null);

  const options: ImportOption[] = useMemo(
    () =>
      [
         {
          id: 'word',
          label: 'Word',
          icon: <WordIcon />,
          extensions: '.docx',
          enabled: true,
          type: 'docx',
        },
        {
          id: 'pdf',
          label: 'PDF',
          icon: <PdfIcon />,
          extensions: '.pdf',
          enabled: true,
          type: 'pdf',
        },
        {
          id: 'markdown',
          label: 'Markdown',
          extensions: '.md .txt',
          enabled: true,
          icon: <MarkdownIcon />,
          type: 'markdown',
        },
      ] satisfies ImportOption[],
    [],
  );

  return (
    <Modal
      open={props.open}
      title="导入页面"
      onOpenChange={(open) => {
        if (open) setSelected('markdown');
        props.onOpenChange(open);
      }}
      footer={null}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((opt) => (
          <OptionCard
            key={opt.id}
            option={opt}
            onSelect={
              opt.enabled && opt.type
                ? () => {
                    setSelected(opt.type);
                    if (opt.type === 'markdown') {
                      fileInputRef.current?.click();
                    } else if (opt.type === 'pdf') {
                      pdfInputRef.current?.click();
                    } else if (opt.type === 'docx') {
                      docxInputRef.current?.click();
                    }
                  }
                : undefined
            }
          />
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="text/markdown,text/plain,.md,.markdown,.mark,.txt"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;

          props.onPickMarkdownFile(file);
          props.onOpenChange(false);
        }}
      />

      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;

          props.onPickPdfFile(file);
          props.onOpenChange(false);
        }}
      />

      <input
        ref={docxInputRef}
        type="file"
        accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;

          props.onPickDocxFile(file);
          props.onOpenChange(false);
        }}
      />
    </Modal>
  );
}
