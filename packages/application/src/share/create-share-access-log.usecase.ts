import type {
  CreateShareAccessLogParams,
  ShareAccessLog,
  ShareAccessLogRepository,
} from '@contexta/domain';
import { normalizeRequiredText } from './utils';

export class CreateShareAccessLogUseCase {
  constructor(private readonly repo: ShareAccessLogRepository) {}

  async create(params: CreateShareAccessLogParams): Promise<ShareAccessLog> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const shareId = normalizeRequiredText('shareId', params.shareId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);

    return await this.repo.create({
      tenantId,
      shareId,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      accessedAt: params.accessedAt ?? new Date(),
      extraData: params.extraData ?? null,
      actorUserId,
    });
  }
}
