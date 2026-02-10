import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
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
  GetShareByIdUseCase,
  ListSharesUseCase,
  UpdateShareStatusUseCase,
} from '@contexta/application';
import { PageService } from '../page/page.service';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { CreateShareDto } from './dto/create-share.dto';
import { ListShareQuery } from './dto/list-share.query';
import { UpdateShareStatusDto } from './dto/update-share-status.dto';
import { CreateShareSnapshotDto } from './dto/create-share-snapshot.dto';
import { AccessShareDto } from './dto/access-share.dto';
import { ListResponse, Response } from '@contexta/shared';
import { Page } from '@prisma/client';
import { Share } from '@contexta/domain';

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

@Controller('shares')
export class ShareController {
  constructor(
    private readonly createUseCase: CreateShareUseCase,
    private readonly listUseCase: ListSharesUseCase,
    private readonly updateStatusUseCase: UpdateShareStatusUseCase,
    private readonly createSnapshotUseCase: CreateShareSnapshotUseCase,
    private readonly latestSnapshotUseCase: GetLatestShareSnapshotUseCase,
    private readonly accessUseCase: GetShareAccessUseCase,
    private readonly accessLogUseCase: CreateShareAccessLogUseCase,
    private readonly getByIdUseCase: GetShareByIdUseCase,
    private readonly pageService: PageService,
  ) { }

  @Post()
  async create(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreateShareDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (!body?.type) throw new BadRequestException('type is required');
    if (!body?.targetId) throw new BadRequestException('targetId is required');
    if (!body?.visibility) throw new BadRequestException('visibility is required');
    if (!body.scopeType) throw new BadRequestException('scopeType is required');
    if (!body.scopeId) throw new BadRequestException('scopeId is required');

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
      type: body.type,
      scopeType: body.scopeType,
      scopeId: body.scopeId,
      targetId: body.targetId,
      visibility: body.visibility,
      status: body.status ?? 'ACTIVE',
      expiresAt,
      password: body.password ?? null,
      tokenEnabled: body.tokenEnabled ?? false,
      extraData: body.extraData ?? null,
      actorUserId: userId,
    });

    return new Response({ share: sanitizeShare(res.share), token: res.token });
  }

  @Get()
  async list(@TenantId() tenantId: string, @Query() query: ListShareQuery) {
    const result = await this.listUseCase.list({
      tenantId,
      type: query.type ?? null,
      targetId: query.targetId ?? null,
      status: query.status ?? null,
      visibility: query.visibility ?? null,
      scopeId: query.scopeId ?? null,
      scopeType: query.scopeType ?? null,
      createdBy: query.createdBy ?? null,
      skip: query.skip ?? null,
      take: query.take ?? null,
    });

    const pages = await this.pageService.getPagesByIds(tenantId, query.scopeId as string, result.items.map((item) => item.targetId));

    return new ListResponse<Omit<Share, "tokenHash" | "passwordHash">, { pages: Page[] }>(
      result.items.map((item) => sanitizeShare(item)),
      { pages },
      { total: result.total },
    );
  }

  @Get(':targetId')
  async getByTargetId(
    @TenantId() tenantId: string,
    @Param('targetId') targetId: string,
  ) {
    const share = await this.getByIdUseCase.getByTargetId({ tenantId, targetId });
    if (!share) throw new NotFoundException('Share not found');
    return new Response(sanitizeShare(share));
  }

  // @Get(':shareId')
  // async getById(
  //   @TenantId() tenantId: string,
  //   @Param('shareId') shareId: string,
  // ) {
  //   const share = await this.getByIdUseCase.get({ tenantId, shareId });
  //   if (!share) throw new NotFoundException('Share not found');
  //   return new Response(sanitizeShare(share));
  // }

  @Post(':shareId/revoke')
  async revoke(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('shareId') shareId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    await this.updateStatusUseCase.update({
      tenantId,
      shareId,
      status: 'REVOKED',
      actorUserId: userId,
    });

    return new Response({ ok: true });
  }

  @Post(':shareId/status')
  async updateStatus(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('shareId') shareId: string,
    @Body() body: UpdateShareStatusDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (!body?.status) throw new BadRequestException('status is required');

    const share = await this.updateStatusUseCase.update({
      tenantId,
      shareId,
      status: body.status,
      actorUserId: userId,
    });

    return new Response(sanitizeShare(share));
  }

  @Post(':shareId/snapshots')
  async createSnapshot(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('shareId') shareId: string,
    @Body() body: CreateShareSnapshotDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const snapshot = await this.createSnapshotUseCase.create({
      tenantId,
      shareId,
      payload: body?.payload ?? null,
      actorUserId: userId,
    });

    return new Response(snapshot);
  }

  @Post('public/:publicId/access')
  async access(
    @Param('publicId') publicId: string,
    @Body() body: AccessShareDto,
    @Req() req: Request,
    @UserId() userId: string | undefined,
  ) {
    let share;
    try {
      share = await this.accessUseCase.getAccess({
        publicId,
        token: body?.token ?? null,
        password: body?.password ?? null,
      });
    } catch (e: any) {
      const msg = e.message;
      if (msg === 'password required' || msg === 'password invalid') {
        throw new UnauthorizedException(msg);
      }
      if (msg === 'share not found') {
        throw new NotFoundException(msg);
      }
      if (msg === 'share not active' || msg === 'share expired') {
        throw new ForbiddenException(msg);
      }
      throw e;
    }

    let snapshot = await this.latestSnapshotUseCase.getLatest({
      tenantId: share.tenantId,
      shareId: share.id,
    });

    if (share.type === 'PAGE') {
      const page = await this.pageService.getPublishedPage(
        share.targetId,
        share.tenantId,
      );
      if (page) {
        snapshot = {
          id: `live-${page.latestPublishedVersionId}`,
          tenantId: share.tenantId,
          shareId: share.id,
          payload: {
            title: page.title,
            content: page.content,
          },
          createdBy: 'system',
          updatedBy: 'system',
          isDeleted: false,
          createdAt: page.updatedAt,
          updatedAt: page.updatedAt,
        };
      }
    }

    await this.accessLogUseCase.create({
      tenantId: share.tenantId,
      shareId: share.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
      extraData: body?.extraData ?? null,
      actorUserId: userId?.trim() || 'guest',
    });

    return new Response({
      share: sanitizeShare(share),
      snapshot,
    });
  }
}
