import type { ShareStatus, ShareType, ShareVisibility } from '@knowra/domain';
import { ShareScopeType } from '@prisma/client';

export type ListShareQuery = {
  type?: ShareType;
  targetId?: string;
  status?: ShareStatus;
  visibility?: ShareVisibility;
  scopeId?: string;
  scopeType: ShareScopeType | null;
  createdBy?: string;
  skip?: number;
  take?: number;
};
