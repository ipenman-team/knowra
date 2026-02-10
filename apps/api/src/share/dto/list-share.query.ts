import type { ShareStatus, ShareType, ShareVisibility } from '@contexta/domain';

export type ListShareQuery = {
  type?: ShareType;
  targetId?: string;
  status?: ShareStatus;
  visibility?: ShareVisibility;
  spaceId?: string;
  createdBy?: string;
  skip?: number;
  take?: number;
};
