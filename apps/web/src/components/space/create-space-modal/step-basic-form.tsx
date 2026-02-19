import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { SpaceIcon } from '@/components/icon/space.icon';
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
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_COLOR, SPACE_COLORS } from './constants';
import type { FormValues } from './types';

type StepBasicFormProps = {
  ids: {
    nameId: string;
    identifierId: string;
    typeId: string;
    categoryId: string;
    descriptionId: string;
  };
  typeValue: FormValues['type'];
  colorValue: string;
  errors: FieldErrors<FormValues>;
  register: UseFormRegister<FormValues>;
  setValue: UseFormSetValue<FormValues>;
};

export function StepBasicForm(props: StepBasicFormProps) {
  const { ids, typeValue, colorValue, errors, register, setValue } = props;

  return (
    <FieldGroup className="gap-4">
      <Field data-invalid={!!errors.name}>
        <FieldLabel htmlFor={ids.nameId}>
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
              id={ids.nameId}
              placeholder="输入空间名称"
              required
              aria-invalid={!!errors.name}
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

      <Field data-invalid={!!errors.type}>
        <FieldLabel htmlFor={ids.typeId}>
          空间类型 <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Select
            value={typeValue}
            onValueChange={(value) =>
              setValue('type', value as 'PERSONAL' | 'ORG', {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id={ids.typeId}>
              <SelectValue placeholder="选择空间类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERSONAL">单人空间</SelectItem>
              <SelectItem value="ORG">协作空间</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={[errors.type]} />
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.identifier}>
        <FieldLabel htmlFor={ids.identifierId}>
          空间标识 <span className="text-destructive">*</span>
        </FieldLabel>
        <FieldContent>
          <Input
            id={ids.identifierId}
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

      <Field data-invalid={!!errors.category}>
        <FieldLabel htmlFor={ids.categoryId}>类别</FieldLabel>
        <FieldContent>
          <Input
            id={ids.categoryId}
            placeholder="选择或输入类别（可选）"
            {...register('category')}
          />
          <FieldError errors={[errors.category]} />
        </FieldContent>
      </Field>

      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor={ids.descriptionId}>描述</FieldLabel>
        <FieldContent>
          <Textarea
            id={ids.descriptionId}
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
  );
}
