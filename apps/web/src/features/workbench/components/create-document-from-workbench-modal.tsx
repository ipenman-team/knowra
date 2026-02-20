'use client';

import { useMemo, useState } from 'react';

import { Modal } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n/provider';

type SpaceOption = {
  id: string;
  name: string;
};

export function CreateDocumentFromWorkbenchModal(props: {
  open: boolean;
  pending: boolean;
  spaces: SpaceOption[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (spaceId: string) => Promise<boolean>;
}) {
  const { t } = useI18n();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const resolvedSpaceId = useMemo(() => {
    const matched = props.spaces.some((space) => space.id === selectedSpaceId);
    if (matched) return selectedSpaceId;
    return props.spaces[0]?.id || '';
  }, [props.spaces, selectedSpaceId]);
  const canConfirm = Boolean(resolvedSpaceId) && !props.pending;

  const handleConfirm = () => {
    if (!canConfirm) return;
    void props.onConfirm(resolvedSpaceId);
  };

  return (
    <Modal
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('workbench.home.newDocument')}
      confirmText={t('common.create')}
      confirmDisabled={!canConfirm}
      cancelDisabled={props.pending}
      onConfirm={handleConfirm}
      className="max-w-md"
    >
      {props.spaces.length === 0 ? (
        <div className="rounded-md bg-muted/40 p-4 text-sm text-muted-foreground">
          {t('workbench.home.noSpaces')}
        </div>
      ) : (
        <div className="space-y-2">
          <Select value={resolvedSpaceId} onValueChange={setSelectedSpaceId}>
            <SelectTrigger>
              <SelectValue placeholder={t('workbench.home.selectSpace')} />
            </SelectTrigger>
            <SelectContent>
              {props.spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </Modal>
  );
}
