'use client';

import { useEffect, useId, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { spacesApi } from '@/lib/api';
import { useMeStore } from '@/stores';
import type { SpaceDto } from '@/lib/api/spaces/types';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { SpaceIcon } from '../icon/space.icon';

const IDENTIFIER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const IDENTIFIER_LENGTH = 8;
const SPACE_COLORS = [
  { label: 'lime', value: '#84CC16' },
  { label: 'green', value: '#22C55E' },
  { label: 'yellow', value: '#EAB308' },
  { label: 'amber', value: '#F59E0B' },
  { label: 'orange', value: '#F97316' },
  { label: 'red', value: '#EF4444' },
  { label: 'sky', value: '#0EA5E9' },
  { label: 'blue', value: '#3B82F6' },
  { label: 'indigo', value: '#6366F1' },
  { label: 'violet', value: '#8B5CF6' },
  { label: 'purple', value: '#A855F7' },
  { label: 'pink', value: '#EC4899' },
  { label: 'rose', value: '#F43F5E' },
  { label: 'gray', value: '#6B7280' },
  { label: 'neutral', value: '#000000' },
];

const DEFAULT_COLOR = SPACE_COLORS.find((x) => x.label === 'blue')?.value;

const generateIdentifier = (length = IDENTIFIER_LENGTH) => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(
      values,
      (value) => IDENTIFIER_CHARS[value % IDENTIFIER_CHARS.length],
    ).join('');
  }

  let result = '';
  for (let i = 0; i < length; i += 1) {
    result +=
      IDENTIFIER_CHARS[Math.floor(Math.random() * IDENTIFIER_CHARS.length)];
  }
  return result;
};

export function CreateSpaceModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (space: SpaceDto) => void;
}) {
  const { open, onOpenChange, onCreated } = props;
  const tenant = useMeStore((s) => s.tenant);
  const isPersonalTenant = tenant?.type === 'PERSONAL';
  const nameId = useId();
  const identifierId = useId();
  const typeId = useId();
  const descriptionId = useId();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      console.log('tenant', tenant);
    }
  }, [open, tenant]);

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
    if (open && !wasOpenRef.current) {
      const currentIdentifier = getValues('identifier');
      if (!currentIdentifier?.trim()) {
        setValue('identifier', generateIdentifier(), { shouldValidate: true });
      }
    }
    wasOpenRef.current = open;
  }, [getValues, open, setValue]);

  const handleCreate = async (values: {
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
      const created = await spacesApi.create({
        name: trimmedName,
        identifier: trimmedIdentifier,
        type: isPersonalTenant ? 'PERSONAL' : values.type,
        description: values.description?.trim() || undefined,
        color: trimmedColor || undefined,
      });
      toast.success('创建成功');
      onCreated?.(created as SpaceDto);
      onOpenChange(false);
      reset({
        name: '',
        identifier: '',
        type: isPersonalTenant ? 'PERSONAL' : 'ORG',
        description: '',
        color: DEFAULT_COLOR,
      });
    } catch (e) {
      // ignore for now
    }
  };

  return (
    <Modal
      open={open}
      title="创建空间"
      onOpenChange={onOpenChange}
      onConfirm={handleSubmit(handleCreate)}
      confirmDisabled={
        isSubmitting ||
        !nameValue?.trim() ||
        !identifierValue?.trim() ||
        !colorValue?.trim()
      }
      confirmText="创建"
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
                      <SpaceIcon color={colorValue || DEFAULT_COLOR} />
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
                {...register('name', {
                  required: '请输入空间名称',
                  validate: (value) =>
                    value?.trim() ? true : '请输入空间名称',
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
              {...register('description')}
            />
            <FieldError errors={[errors.description]} />
          </FieldContent>
        </Field>
      </FieldGroup>
    </Modal>
  );
}

export default CreateSpaceModal;
