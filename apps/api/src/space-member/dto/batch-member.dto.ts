export type BatchUpdateMemberRoleDto = {
  memberIds?: string[];
  roleId?: string;
};

export type BatchRemoveMembersDto = {
  memberIds?: string[];
};
