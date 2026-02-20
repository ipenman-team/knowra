import type {
  SpaceMemberRepository,
  SpaceMemberSummary,
  SpaceRoleRepository,
} from '@contexta/domain';
import { normalizePagination, normalizeRequiredText } from './utils';

export class ListSpaceMembersUseCase {
  constructor(
    private readonly memberRepo: SpaceMemberRepository,
    private readonly roleRepo: SpaceRoleRepository,
  ) {}

  async list(params: {
    tenantId: string;
    spaceId: string;
    actorUserId: string;
    q?: string | null;
    skip?: number;
    take?: number;
  }): Promise<{
    items: SpaceMemberSummary[];
    total: number;
    skip: number;
    take: number;
  }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const spaceId = normalizeRequiredText('spaceId', params.spaceId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);
    const q = params.q ? String(params.q).trim() : null;
    const { skip, take } = normalizePagination({
      skip: params.skip,
      take: params.take,
    });

    const canManage = await this.roleRepo.canManageMembers({
      tenantId,
      spaceId,
      userId: actorUserId,
      permission: 'space.member.view',
    });

    if (!canManage) throw new Error('permission denied');

    const result = await this.memberRepo.listMembers({
      tenantId,
      spaceId,
      q,
      skip,
      take,
    });

    return {
      ...result,
      skip,
      take,
    };
  }
}
