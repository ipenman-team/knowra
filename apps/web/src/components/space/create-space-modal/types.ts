export type Step = 1 | 2;

export type InviteRole = 'ADMIN' | 'MEMBER';

export type EmailInviteDraft = {
  email: string;
  role: InviteRole;
};

export type FormValues = {
  name: string;
  identifier: string;
  type: 'PERSONAL' | 'ORG';
  category: string;
  description: string;
  color: string;
};
