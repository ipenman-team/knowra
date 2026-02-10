import type { Share, ShareRepository, ShareStatus, ShareType, ShareVisibility } from '@contexta/domain';
import * as crypto from 'node:crypto';
import { normalizeRequiredText } from './utils';

function makePublicId(): string {
  return crypto.randomBytes(8).toString('base64url');
}

function makeToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(raw: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(raw, salt, 32);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

export class CreateShareUseCase {
  constructor(private readonly repo: ShareRepository) {}

  async create(params: {
    tenantId: string;
    type: ShareType;
    targetId: string;
    visibility: ShareVisibility;
    status?: ShareStatus | null;
    expiresAt?: Date | null;
    password?: string | null;
    tokenEnabled?: boolean | null;
    extraData?: unknown | null;
    actorUserId: string;
  }): Promise<{ share: Share; token: string | null }> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const actorUserId = normalizeRequiredText('actorUserId', params.actorUserId);
    const targetId = normalizeRequiredText('targetId', params.targetId);
    const type = params.type;
    if (!type) throw new Error('type is required');
    const visibility = params.visibility;
    if (!visibility) throw new Error('visibility is required');

    const status = params.status ?? 'ACTIVE';

    const existing = await this.repo.list({
      tenantId,
      type,
      targetId,
      status: 'ACTIVE',
      skip: 0,
      take: 20,
    });

    for (const item of existing.items) {
      await this.repo.updateStatus({
        tenantId,
        shareId: item.id,
        status: 'REVOKED',
        actorUserId,
      });
    }

    const publicId = makePublicId();
    const password = typeof params.password === 'string' ? params.password.trim() : '';
    const passwordHash = password ? hashPassword(password) : null;

    const tokenEnabled = Boolean(params.tokenEnabled);
    const token = tokenEnabled ? makeToken() : null;
    const tokenHash = token ? hashToken(token) : null;

    const share = await this.repo.create({
      tenantId,
      type,
      targetId,
      status,
      visibility,
      publicId,
      tokenHash,
      expiresAt: params.expiresAt ?? null,
      passwordHash,
      extraData: params.extraData ?? null,
      actorUserId,
    });

    return { share, token };
  }
}
