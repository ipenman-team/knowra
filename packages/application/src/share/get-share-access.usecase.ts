import type { Share, ShareRepository } from '@contexta/domain';
import * as crypto from 'node:crypto';
import { normalizeRequiredText } from './utils';

function verifyPassword(raw: string, secretHash: string | null | undefined): boolean {
  if (!secretHash) return false;
  const [saltHex, hashHex] = secretHash.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(raw, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class GetShareAccessUseCase {
  constructor(private readonly repo: ShareRepository) {}

  async getAccess(params: {
    publicId: string;
    token?: string | null;
    password?: string | null;
    now?: Date | null;
  }): Promise<Share> {
    const publicId = normalizeRequiredText('publicId', params.publicId);

    const share = await this.repo.getByPublicId({ publicId });
    if (!share || share.isDeleted) throw new Error('share not found');
    if (share.status !== 'ACTIVE') throw new Error('share not active');

    const now = params.now ?? new Date();
    if (share.expiresAt && share.expiresAt.getTime() <= now.getTime()) {
      await this.repo.updateStatus({
        tenantId: share.tenantId,
        shareId: share.id,
        status: 'EXPIRED',
        actorUserId: share.updatedBy,
      });
      throw new Error('share expired');
    }

    if (share.tokenHash) {
      const token = typeof params.token === 'string' ? params.token.trim() : '';
      if (!token) throw new Error('token required');
      const tokenHash = hashToken(token);
      if (tokenHash !== share.tokenHash) throw new Error('token invalid');
    }

    if (share.passwordHash) {
      const password = typeof params.password === 'string' ? params.password.trim() : '';
      if (!password) throw new Error('password required');
      if (!verifyPassword(password, share.passwordHash)) {
        throw new Error('password invalid');
      }
    }

    return share;
  }
}
