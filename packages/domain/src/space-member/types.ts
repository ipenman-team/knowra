import type { SpaceMemberRoleValue } from '../space-invitation';
import type { SpaceRoleBuiltInTypeValue } from '../space-role';

export type SpaceMemberSummary = {
  id: string;
  spaceId: string;
  userId: string;
  role: SpaceMemberRoleValue;
  spaceRoleId: string | null;
  roleName: string;
  roleBuiltInType: SpaceRoleBuiltInTypeValue | null;
  roleIsBuiltIn: boolean;
  nickname: string | null;
  avatarUrl: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SpaceMemberRecord = {
  id: string;
  spaceId: string;
  userId: string;
  role: SpaceMemberRoleValue;
  spaceRoleId: string | null;
  isDeleted: boolean;
};
