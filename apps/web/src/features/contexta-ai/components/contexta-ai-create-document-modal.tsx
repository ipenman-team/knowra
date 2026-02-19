import { useId, useState } from 'react';

import { Markdown } from '@/components/shared/markdown';
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/dialog';
import { Segmented } from '@/components/ui/segmented';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n/provider';

type PreviewMode = 'preview' | 'markdown';

export function ContextaAiCreateDocumentModal(props: {
  open: boolean;
  pending: boolean;
  initialTitle: string;
  markdownContent: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const titleId = useId();
  const [title, setTitle] = useState(
    props.initialTitle.trim() || t('contextaAiInsert.untitled'),
  );
  const [mode, setMode] = useState<PreviewMode>('preview');

  const normalizedTitle = title.trim();
  const canConfirm = normalizedTitle.length > 0 && !props.pending;

  const handleConfirm = () => {
    if (!canConfirm) return;
    void props.onConfirm(normalizedTitle);
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('contextaAiInsert.newDocument')}
      className="max-w-2xl"
      onConfirm={handleConfirm}
      confirmText={t('contextaAiInsert.createAndPublish')}
      confirmDisabled={!canConfirm}
      cancelDisabled={props.pending}
    >
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor={titleId}>
            {t('contextaAiInsert.pageTitleLabel')}
          </FieldLabel>
          <FieldContent>
            <Input
              id={titleId}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('contextaAiInsert.pageTitlePlaceholder')}
              disabled={props.pending}
              maxLength={80}
              autoFocus
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>{t('contextaAiInsert.previewMode')}</FieldLabel>
          <FieldContent className="space-y-3">
            <Segmented<PreviewMode>
              value={mode}
              onValueChange={setMode}
              options={[
                {
                  value: 'preview',
                  label: t('contextaAiInsert.preview'),
                },
                {
                  value: 'markdown',
                  label: t('contextaAiInsert.markdown'),
                },
              ]}
            />

            {mode === 'preview' ? (
              <div className="max-h-80 overflow-y-auto rounded-md border bg-background p-3">
                <Markdown content={props.markdownContent} />
              </div>
            ) : (
              <Textarea
                readOnly
                value={props.markdownContent}
                className="max-h-80 min-h-56 font-mono text-xs leading-5"
              />
            )}
          </FieldContent>
        </Field>
      </FieldGroup>
    </Modal>
  );
}
