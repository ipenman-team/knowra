import type { ShareStatus, ShareType, ShareVisibility } from '@contexta/domain';
import { ShareScopeType } from '@contexta/domain/src/share/types';

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
