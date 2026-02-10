import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CreateShareAccessLogUseCase,
  CreateShareSnapshotUseCase,
  CreateShareUseCase,
  GetLatestShareSnapshotUseCase,
  GetShareAccessUseCase,
} from '@contexta/application';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { CreateAiShareDto } from './dto/create-ai-share.dto';
import { AccessAiShareDto } from './dto/access-ai-share.dto';

function sanitizeShare<T extends { tokenHash?: unknown; passwordHash?: unknown }>(
  share: T,
): Omit<T, 'tokenHash' | 'passwordHash'> {
  const rest = { ...share } as Omit<T, 'tokenHash' | 'passwordHash'> & {
    tokenHash?: unknown;
    passwordHash?: unknown;
  };
  delete rest.tokenHash;
  delete rest.passwordHash;
  return rest;
}

@Controller()
export class ShareController {
  constructor(
    private readonly createUseCase: CreateShareUseCase,
    private readonly createSnapshotUseCase: CreateShareSnapshotUseCase,
    private readonly latestSnapshotUseCase: GetLatestShareSnapshotUseCase,
    private readonly accessUseCase: GetShareAccessUseCase,
    private readonly accessLogUseCase: CreateShareAccessLogUseCase,
  ) {}

  @Post('ai-shares')
  async create(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreateAiShareDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (!body?.targetId) throw new BadRequestException('targetId is required');
    if (!body?.visibility) throw new BadRequestException('visibility is required');

    const expiresAtRaw = body.expiresAt ?? null;
    let expiresAt: Date | null = null;
    if (typeof expiresAtRaw === 'string' && expiresAtRaw.trim()) {
      const parsed = new Date(expiresAtRaw);
      if (!Number.isFinite(parsed.getTime())) {
        throw new BadRequestException('expiresAt invalid');
      }
      expiresAt = parsed;
    } else if (expiresAtRaw instanceof Date) {
      expiresAt = expiresAtRaw;
    }

    const res = await this.createUseCase.create({
      tenantId,
      type: 'AI_CONVERSATION',
      targetId: body.targetId,
      visibility: body.visibility,
      status: 'ACTIVE',
      expiresAt,
      password: body.password ?? null,
      tokenEnabled: body.tokenEnabled ?? false,
      extraData: body.extraData ?? null,
      actorUserId: userId,
    });

    return { ok: true, share: sanitizeShare(res.share), token: res.token };
  }

  @Post('public/ai-shares/:publicId/access')
  async access(
    @Param('publicId') publicId: string,
    @Body() body: AccessAiShareDto,
    @Req() req: Request,
    @UserId() userId: string | undefined,
  ) {
    const share = await this.accessUseCase.getAccess({
      publicId,
      token: body?.token ?? null,
      password: body?.password ?? null,
    });

    const snapshot = await this.latestSnapshotUseCase.getLatest({
      tenantId: share.tenantId,
      shareId: share.id,
    });

    await this.accessLogUseCase.create({
      tenantId: share.tenantId,
      shareId: share.id,
      ip: req.ip || '',
      userAgent: req.headers['user-agent'] ?? null,
      extraData: body?.extraData ?? null,
      actorUserId: userId?.trim() || 'guest',
    });

    return {
      ok: true,
      share: sanitizeShare(share),
      snapshot,
    };
  }
}
