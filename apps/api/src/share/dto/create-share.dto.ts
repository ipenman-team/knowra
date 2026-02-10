import type { ShareStatus, ShareType, ShareVisibility } from '@contexta/domain';

export type CreateShareDto = {
  type: ShareType;
  targetId: string;
  visibility: ShareVisibility;
  status?: ShareStatus;
  expiresAt?: string | Date | null;
  password?: string | null;
  tokenEnabled?: boolean | null;
  extraData?: unknown | null;
};
