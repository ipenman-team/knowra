import type { ShareStatus, ShareType, ShareVisibility } from '@contexta/domain';
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
