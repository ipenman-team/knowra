import type { ShareStatus, ShareType, ShareVisibility } from '@knowra/domain';
import { ShareScopeType } from '@knowra/domain/src/share/types';

export type CreateShareDto = {
  type: ShareType;
  targetId: string;
  scopeType?: ShareScopeType;
  scopeId?: string;
  visibility: ShareVisibility;
  status?: ShareStatus;
  expiresAt?: string | Date | null;
  password?: string | null;
  tokenEnabled?: boolean | null;
  extraData?: unknown | null;
};
