'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { SpaceIcon } from '@/components/icon/space.icon';

import { spacesApi } from '@/lib/api';
import type { SpaceDto } from '@/lib/api';
import { useMeStore } from '@/stores';

const SPACE_COLORS = [
  { label: 'lime', value: '#a3e635' },
  { label: 'green', value: '#4ade80' },
  { label: 'yellow', value: '#eab308' },
  { label: 'amber', value: '#f59e0b' },
  { label: 'orange', value: '#f97316' },
  { label: 'red', value: '#ef4444' },
  { label: 'sky', value: '#0ea5e9' },
  { label: 'blue', value: '#60a5fa' },
  { label: 'indigo', value: '#6366f1' },
  { label: 'violet', value: '#8b5cf6' },
  { label: 'purple', value: '#a855f7' },
  { label: 'pink', value: '#ec4899' },
  { label: 'rose', value: '#f43f5e' },
  { label: 'gray', value: '#6b7280' },
  { label: 'neutral', value: '#000000' },
];

const DEFAULT_COLOR = SPACE_COLORS.find((x) => x.label === 'blue')?.value;

export function EditSpaceModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaceId: string;
  onUpdated?: (space: SpaceDto) => void;
}) {
  const { open, onOpenChange, spaceId, onUpdated } = props;

  const tenant = useMeStore((s) => s.tenant);
  const isPersonalTenant = tenant?.type === 'PERSONAL';

  const nameId = useId();
  const identifierId = useId();
  const typeId = useId();
  const descriptionId = useId();

  const wasOpenRef = useRef(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<SpaceDto | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<{
    name: string;
    identifier: string;
    type: 'PERSONAL' | 'ORG';
    description: string;
    color: string;
  }>({
    defaultValues: {
      name: '',
      identifier: '',
      type: 'ORG',
      description: '',
      color: DEFAULT_COLOR,
    },
  });

  useEffect(() => {
    if (isPersonalTenant) {
      setValue('type', 'PERSONAL', { shouldValidate: true });
    }
  }, [isPersonalTenant, setValue]);

  const nameValue = watch('name');
  const identifierValue = watch('identifier');
  const colorValue = watch('color');

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    (async () => {
      setLoadingDetail(true);
      try {
        const fetched = await spacesApi.get(spaceId);
        setDetail(fetched);

        reset({
          name: fetched.name ?? '',
          identifier: (fetched.identifier ?? '').trim(),
          type: (isPersonalTenant ? 'PERSONAL' : (fetched.type as any)) || 'ORG',
          description: (fetched.description ?? '') || '',
          color: (fetched.color ?? DEFAULT_COLOR) || DEFAULT_COLOR,
        });
      } catch {
        toast.error('加载空间信息失败');
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [isPersonalTenant, open, reset, spaceId]);

  const handleUpdate = async (values: {
    name: string;
    identifier: string;
    type: 'PERSONAL' | 'ORG';
    description: string;
    color: string;
  }) => {
    const trimmedName = values.name?.trim();
    const trimmedIdentifier = values.identifier?.trim();
    const trimmedColor = values.color?.trim();

    if (!trimmedName || !trimmedIdentifier) return;

    try {
      const updated = await spacesApi.update(spaceId, {
        name: trimmedName,
        identifier: trimmedIdentifier,
        type: isPersonalTenant ? 'PERSONAL' : values.type,
        description: values.description?.trim() || null,
        color: trimmedColor || null,
      });

      toast.success('更新成功');
      onUpdated?.(updated as SpaceDto);
      onOpenChange(false);
    } catch {
      toast.error('更新失败');
    }
  };

  const confirmDisabled =
    loadingDetail ||
    isSubmitting ||
    !nameValue?.trim() ||
    !identifierValue?.trim() ||
    !colorValue?.trim();

  const currentColor = getValues('color') || detail?.color || DEFAULT_COLOR;

  return (
    <Modal
      open={open}
      className="max-w-lg"
      title="编辑空间"
      onOpenChange={onOpenChange}
      onConfirm={handleSubmit(handleUpdate)}
      confirmDisabled={confirmDisabled}
    >
      <FieldGroup className="gap-4">
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor={nameId}>
            空间名称 <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <InputGroup>
              <InputGroupAddon>
                <Popover>
                  <PopoverTrigger asChild>
                    <InputGroupButton aria-label="选择颜色" size="icon-sm">
                      <SpaceIcon color={currentColor || DEFAULT_COLOR} />
                    </InputGroupButton>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    className="w-auto p-2"
                    sideOffset={6}
                  >
                    <div className="flex flex-wrap gap-2">
                      {SPACE_COLORS.map((color) => {
                        const isSelected = colorValue === color.value;
                        return (
                          <button
                            key={color.label}
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={`颜色 ${color.label}`}
                            onClick={() =>
                              setValue('color', color.value, {
                                shouldValidate: true,
                              })
                            }
                            className={[
                              'h-6 w-6 rounded-none border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                              isSelected
                                ? 'border-transparent ring-2 ring-ring ring-offset-2 ring-offset-background'
                                : 'border-input',
                            ].join(' ')}
                            style={{ backgroundColor: color.value }}
                          />
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </InputGroupAddon>
              <InputGroupInput
                id={nameId}
                placeholder="输入空间名称"
                required
                aria-invalid={!!errors.name}
                disabled={loadingDetail}
                {...register('name', {
                  required: '请输入空间名称',
                  validate: (value) => (value?.trim() ? true : '请输入空间名称'),
                })}
              />
            </InputGroup>
            <input type="hidden" {...register('color')} />
            <FieldError errors={[errors.name]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.identifier}>
          <FieldLabel htmlFor={identifierId}>
            空间标识 <span className="text-destructive">*</span>
          </FieldLabel>
          <FieldContent>
            <Input
              id={identifierId}
              placeholder="大写字母或数字，最长15"
              required
              aria-invalid={!!errors.identifier}
              disabled={loadingDetail}
              {...register('identifier', {
                required: '请输入空间标识',
                maxLength: { value: 15, message: '空间标识最多15个字符' },
                pattern: {
                  value: /^[A-Z0-9]+$/,
                  message: '空间标识仅支持大写字母或数字',
                },
                validate: (value) => (value?.trim() ? true : '请输入空间标识'),
              })}
            />
            <FieldError errors={[errors.identifier]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.type}>
          <FieldLabel htmlFor={typeId}>可见范围</FieldLabel>
          <FieldContent>
            {isPersonalTenant ? (
              <select
                id={typeId}
                className="block w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                disabled
                {...register('type')}
              >
                <option value="PERSONAL">个人</option>
              </select>
            ) : (
              <select
                id={typeId}
                className="block w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                disabled={loadingDetail}
                {...register('type')}
              >
                <option value="PERSONAL">个人</option>
                <option value="ORG">组织</option>
              </select>
            )}
            <FieldError errors={[errors.type]} />
          </FieldContent>
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor={descriptionId}>描述</FieldLabel>
          <FieldContent>
            <Textarea
              id={descriptionId}
              placeholder="输入空间描述"
              className="block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              rows={4}
              aria-invalid={!!errors.description}
              disabled={loadingDetail}
              {...register('description')}
            />
            <FieldError errors={[errors.description]} />
          </FieldContent>
        </Field>
      </FieldGroup>
    </Modal>
  );
}

export default EditSpaceModal;
