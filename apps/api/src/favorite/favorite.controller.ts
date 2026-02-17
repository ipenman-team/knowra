import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  GetFavoriteStatusUseCase,
  ListFavoritesUseCase,
  SetFavoriteUseCase,
} from '@contexta/application';
import { ListResponse, Response } from '@contexta/shared';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { SetFavoriteDto } from './dto/set-favorite.dto';
import { ListFavoriteQuery } from './dto/list-favorite.query';

function parseTargetIds(raw: string | undefined): string[] {
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => Boolean(item));
}

@Controller('favorites')
export class FavoriteController {
  constructor(
    private readonly setFavoriteUseCase: SetFavoriteUseCase,
    private readonly getFavoriteStatusUseCase: GetFavoriteStatusUseCase,
    private readonly listFavoritesUseCase: ListFavoritesUseCase,
  ) {}

  @Put()
  async setFavorite(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: SetFavoriteDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (typeof body?.targetType !== 'string' || !body.targetType.trim()) {
      throw new BadRequestException('targetType is required');
    }
    if (typeof body?.targetId !== 'string' || !body.targetId.trim()) {
      throw new BadRequestException('targetId is required');
    }
    if (typeof body?.favorite !== 'boolean') {
      throw new BadRequestException('favorite must be boolean');
    }

    const result = await this.setFavoriteUseCase.set({
      tenantId,
      userId,
      targetType: body.targetType,
      targetId: body.targetId,
      favorite: body.favorite,
      extraData: body.extraData,
    });

    return new Response(result);
  }

  @Get('status')
  async getFavoriteStatus(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Query('targetType') targetType: string | undefined,
    @Query('targetId') targetId: string | undefined,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (typeof targetType !== 'string' || !targetType.trim()) {
      throw new BadRequestException('targetType is required');
    }
    if (typeof targetId !== 'string' || !targetId.trim()) {
      throw new BadRequestException('targetId is required');
    }

    const result = await this.getFavoriteStatusUseCase.getStatus({
      tenantId,
      userId,
      targetType,
      targetId,
    });

    return new Response(result);
  }

  @Get()
  async listFavorites(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Query() query: ListFavoriteQuery,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    const result = await this.listFavoritesUseCase.list({
      tenantId,
      userId,
      targetType: query.targetType ?? null,
      targetIds: parseTargetIds(query.targetIds),
      skip: query.skip ? Number(query.skip) : null,
      take: query.take ? Number(query.take) : null,
    });

    return new ListResponse(result.items, undefined, { total: result.total });
  }
}
