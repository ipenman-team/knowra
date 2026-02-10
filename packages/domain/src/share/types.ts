export type ShareType = 'PAGE' | 'SPACE' | 'AI_CONVERSATION' | 'CUSTOM';

export type ShareStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export type ShareVisibility = 'PUBLIC' | 'RESTRICTED';

export type Share = {
  id: string;
  tenantId: string;
  type: ShareType;
  targetId: string;
  status: ShareStatus;
  visibility: ShareVisibility;
  publicId: string;
  tokenHash?: string | null;
  expiresAt?: Date | null;
  passwordHash?: string | null;
  extraData?: unknown | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ShareSnapshot = {
  id: string;
  tenantId: string;
  shareId: string;
  payload: unknown;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ShareAccessLog = {
  id: string;
  tenantId: string;
  shareId: string;
  ip?: string | null;
  userAgent?: string | null;
  accessedAt: Date;
  extraData?: unknown | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateShareParams = {
  tenantId: string;
  type: ShareType;
  targetId: string;
  status: ShareStatus;
  visibility: ShareVisibility;
  publicId: string;
  tokenHash?: string | null;
  expiresAt?: Date | null;
  passwordHash?: string | null;
  extraData?: unknown | null;
  actorUserId: string;
};

export type UpdateShareStatusParams = {
  tenantId: string;
  shareId: string;
  status: ShareStatus;
  actorUserId: string;
};

export type GetShareByIdParams = {
  tenantId: string;
  shareId: string;
};

export type GetShareByPublicIdParams = {
  publicId: string;
};

export type ListSharesParams = {
  tenantId: string;
  type?: ShareType | null;
  targetId?: string | null;
  status?: ShareStatus | null;
  visibility?: ShareVisibility | null;
  createdBy?: string | null;
  skip?: number | null;
  take?: number | null;
};

export type ListSharesResult = {
  items: Share[];
  total: number;
};

export type CreateShareSnapshotParams = {
  tenantId: string;
  shareId: string;
  payload: unknown;
  actorUserId: string;
};

export type GetLatestShareSnapshotParams = {
  tenantId: string;
  shareId: string;
};

export type CreateShareAccessLogParams = {
  tenantId: string;
  shareId: string;
  ip?: string | null;
  userAgent?: string | null;
  accessedAt?: Date | null;
  extraData?: unknown | null;
  actorUserId: string;
};
