'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Modal } from '@/components/ui/dialog';
import { spacesApi } from '@/lib/api';
import type { SpaceDto } from '@/lib/api/spaces/types';

import { DEFAULT_COLOR } from './create-space-modal/constants';
import { FooterActions } from './create-space-modal/footer-actions';
import { generateIdentifier, parseEmails } from './create-space-modal/helpers';
import { StepBasicForm } from './create-space-modal/step-basic-form';
import { StepInviteForm } from './create-space-modal/step-invite-form';
import type {
  EmailInviteDraft,
  FormValues,
  InviteRole,
  Step,
} from './create-space-modal/types';

function getEmptyFormValues(): FormValues {
  return {
    name: '',
    identifier: '',
    type: 'PERSONAL',
    category: '',
    description: '',
    color: DEFAULT_COLOR,
  };
}

export function CreateSpaceModal(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (space: SpaceDto) => void;
}) {
  const { open, onOpenChange, onCreated } = props;

  const wasOpenRef = useRef(false);

  const [step, setStep] = useState<Step>(1);
  const [creating, setCreating] = useState(false);

  const [inviteInput, setInviteInput] = useState('');
  const [inviteRole, setInviteRole] = useState<InviteRole>('MEMBER');
  const [emailInvites, setEmailInvites] = useState<EmailInviteDraft[]>([]);
  const [createLinkInvite, setCreateLinkInvite] = useState(false);
  const [linkInviteRole, setLinkInviteRole] = useState<InviteRole>('MEMBER');

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: getEmptyFormValues(),
  });

  const nameValue = watch('name');
  const identifierValue = watch('identifier');
  const typeValue = watch('type');
  const colorValue = watch('color');

  const hasPendingInvites = emailInvites.length > 0 || createLinkInvite;
  const isCollaborativeSpace = typeValue === 'ORG';

  const inviteGroups = useMemo(
    () =>
      emailInvites.reduce(
        (acc, item) => {
          acc[item.role].push(item.email);
          return acc;
        },
        { MEMBER: [] as string[], ADMIN: [] as string[] },
      ),
    [emailInvites],
  );

  const resetInviteState = () => {
    setInviteInput('');
    setInviteRole('MEMBER');
    setEmailInvites([]);
    setCreateLinkInvite(false);
    setLinkInviteRole('MEMBER');
  };

  const resetAll = () => {
    reset(getEmptyFormValues());
    setStep(1);
    setCreating(false);
    resetInviteState();
  };

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const currentIdentifier = getValues('identifier');
      if (!currentIdentifier?.trim()) {
        setValue('identifier', generateIdentifier(), { shouldValidate: true });
      }
    }

    if (!open && wasOpenRef.current) {
      resetAll();
    }

    wasOpenRef.current = open;
  }, [getValues, open, reset, setValue]);

  const addEmails = () => {
    const { valid, invalid } = parseEmails(inviteInput);
    if (invalid.length > 0) {
      toast.error(`邮箱格式不正确: ${invalid.join(', ')}`);
    }
    if (valid.length === 0) return;

    setEmailInvites((prev) => {
      const exists = new Set(prev.map((item) => item.email));
      const next = [...prev];
      for (const email of valid) {
        if (exists.has(email)) continue;
        next.push({ email, role: inviteRole });
      }
      return next;
    });

    setInviteInput('');
  };

  const createSpace = async (values: FormValues, skipInvites: boolean) => {
    const trimmedName = values.name?.trim();
    const trimmedIdentifier = values.identifier?.trim();
    const trimmedColor = values.color?.trim();
    if (!trimmedName || !trimmedIdentifier) return;

    setCreating(true);
    try {
      const category = values.category?.trim();

      const created = await spacesApi.create({
        name: trimmedName,
        identifier: trimmedIdentifier,
        type: values.type,
        description: values.description?.trim() || undefined,
        color: trimmedColor || undefined,
        metadata: category ? { category } : {},
      });

      let inviteFailures = 0;
      let inviteCreated = 0;
      let linkUrl: string | null = null;

      if (!skipInvites && values.type === 'ORG') {
        const createByRole = async (role: InviteRole, emails: string[]) => {
          if (emails.length === 0) return;
          try {
            const rows = await spacesApi.createEmailInvitations(created.id, {
              role,
              emails,
            });
            inviteCreated += rows.length;
          } catch {
            inviteFailures += emails.length;
          }
        };

        await createByRole('MEMBER', inviteGroups.MEMBER);
        await createByRole('ADMIN', inviteGroups.ADMIN);

        if (createLinkInvite) {
          try {
            const linkInvite = await spacesApi.createLinkInvitation(
              created.id,
              {
                role: linkInviteRole,
              },
            );
            linkUrl = linkInvite.inviteUrl;
          } catch {
            inviteFailures += 1;
          }
        }
      }

      if (linkUrl) {
        await navigator?.clipboard?.writeText(linkUrl).catch(() => null);
      }

      if (inviteFailures > 0) {
        toast.warning('空间已创建，部分邀请发送失败');
      } else if (inviteCreated > 0 || linkUrl) {
        const text = linkUrl
          ? '创建成功，邀请已发送（链接已复制）'
          : '创建成功，邀请已发送';
        toast.success(text);
      } else {
        toast.success('创建成功');
      }

      onCreated?.(created as SpaceDto);
      onOpenChange(false);
      resetAll();
    } catch {
      // apiClient interceptor will show toast
    } finally {
      setCreating(false);
    }
  };

  const goToStep2 = handleSubmit((values) => {
    if (values.type === 'ORG') {
      setStep(2);
      return;
    }

    void createSpace(values, true);
  });

  const handleCreateOnly = handleSubmit(async (values) => {
    await createSpace(values, true);
  });

  const handleCreateWithInvites = handleSubmit(async (values) => {
    await createSpace(values, false);
  });

  const canGoNext =
    !creating &&
    Boolean(nameValue?.trim()) &&
    Boolean(identifierValue?.trim()) &&
    Boolean(colorValue?.trim());

  return (
    <Modal
      open={open}
      className="max-w-lg"
      title={step === 1 ? '创建空间' : '邀请成员'}
      footer={
        <FooterActions
          step={step}
          creating={creating}
          canGoNext={canGoNext}
          isCollaborativeSpace={isCollaborativeSpace}
          hasPendingInvites={hasPendingInvites}
          onCancel={() => onOpenChange(false)}
          onNext={() => void goToStep2()}
          onBack={() => setStep(1)}
          onCreateOnly={() => void handleCreateOnly()}
          onCreateWithInvites={() => void handleCreateWithInvites()}
        />
      }
      onOpenChange={onOpenChange}
    >
      {step === 1 ? (
        <StepBasicForm
          ids={{
            nameId: 'create-space-name',
            identifierId: 'create-space-identifier',
            typeId: 'create-space-type',
            categoryId: 'create-space-category',
            descriptionId: 'create-space-description',
          }}
          typeValue={typeValue}
          colorValue={colorValue}
          errors={errors}
          register={register}
          setValue={setValue}
        />
      ) : (
        <StepInviteForm
          inviteInputId="create-space-invite-input"
          inviteInput={inviteInput}
          inviteRole={inviteRole}
          emailInvites={emailInvites}
          createLinkInvite={createLinkInvite}
          linkInviteRole={linkInviteRole}
          onInviteInputChange={setInviteInput}
          onInviteRoleChange={setInviteRole}
          onAddEmails={addEmails}
          onRemoveInvite={(email) =>
            setEmailInvites((prev) =>
              prev.filter((item) => item.email !== email),
            )
          }
          onCreateLinkInviteChange={setCreateLinkInvite}
          onLinkInviteRoleChange={setLinkInviteRole}
        />
      )}
    </Modal>
  );
}

export default CreateSpaceModal;
