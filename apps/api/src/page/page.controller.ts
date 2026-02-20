import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { SavePageDto } from './dto/save-page.dto';
import { SetPageLikeDto } from './dto/set-page-like.dto';
import { PageService } from './page.service';
import { PageLikeService } from './page-like.service';
import { RagIndexService } from '../rag/rag.index.service';
import { ListPageQuery } from './dto/list-page.query';
import { ListPageTreeQuery } from './dto/list-page-tree.query';
import { ListResponse, Response } from '@knowra/shared';
import { ExportPageUseCase } from '@knowra/application';
import { ExportPageQuery } from './dto/export-page.query';

type GetPageQuery = {
  trackView?: string;
};

function parseBooleanQuery(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  return raw.trim().toLowerCase() === 'true';
}

@Controller('spaces/:spaceId/pages')
export class PageController {
  constructor(
    private readonly pageService: PageService,
    private readonly pageLikeService: PageLikeService,
    private readonly ragIndexService: RagIndexService,
    private readonly exportPageUseCase: ExportPageUseCase,
  ) {}

  @Post()
  async create(
    @TenantId() tenantId: string,
    @Param('spaceId') spaceId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreatePageDto,
  ) {
    return new Response(
      await this.pageService.create(tenantId, { ...body, spaceId }, userId),
    );
  }

  @Post(':id/rename')
  async rename(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    return new Response(
      await this.pageService.rename(tenantId, id, body),
    );
  }

  @Put(':id')
  async save(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: SavePageDto,
  ) {
    const page = await this.pageService.save(tenantId, id, body);
    if (body.publish) {
      // async index
      this.ragIndexService
        .startIndexPublished({
          tenantId,
          pageId: page.id,
          pageVersionId: page.latestPublishedVersionId!,
        });
    }
    return new Response(page);
  }

  @Post(':id/publish')
  publish(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
  ) {
    const actor = userId?.trim() || 'system';

    return (async () => {
      const published = await this.pageService.publish(tenantId, id, actor);

      this.ragIndexService.startIndexPublished({
        tenantId,
        pageId: id,
        pageVersionId: published.versionId,
      });

      return new Response(published);
    })();
  }

  @Get(':id/like')
  async getLikeSummary(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    return new Response(
      await this.pageLikeService.getSummary({
        tenantId,
        userId,
        spaceId,
        pageId: id,
      }),
    );
  }

  @Put(':id/like')
  async setLike(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() body: SetPageLikeDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (typeof body?.liked !== 'boolean') {
      throw new BadRequestException('liked must be boolean');
    }

    return new Response(
      await this.pageLikeService.setLike({
        tenantId,
        userId,
        spaceId,
        pageId: id,
        liked: body.liked,
      }),
    );
  }

  @Get(':id/versions')
  async listVersions(@Param('id') id: string, @TenantId() tenantId: string) {
    return new ListResponse(
      await this.pageService.listVersions(id, tenantId),
    );
  }

  @Get(':id/versions/:versionId')
  async getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @TenantId() tenantId: string,
  ) {
    return new Response(
      await this.pageService.getVersion(id, versionId, tenantId),
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
  ) {
    return new Response(
      await this.pageService.remove(id, tenantId, userId),
    );
  }

  @Get('tree')
  async listTree(
    @TenantId() tenantId: string,
    @Param('spaceId') spaceId: string,
    @Query() query: ListPageTreeQuery,
  ) {
    const result = await this.pageService.listTree(tenantId, spaceId, query);
    return new ListResponse(
      result.items,
      undefined,
      { nextCursor: result.nextCursor, hasMore: result.hasMore },
    );
  }

  @Get('trash')
  async listTrash(
    @TenantId() tenantId: string,
    @Param('spaceId') spaceId: string,
    @Query() query: ListPageQuery,
  ) {
    return new ListResponse(
      await this.pageService.listTrash(tenantId, spaceId, query),
    );
  }

  @Post(':id/restore')
  async restore(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
  ) {
    return new Response(
      await this.pageService.restore(tenantId, id, userId),
    );
  }

  @Delete(':id/permanent')
  async permanentRemove(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
  ) {
    return new Response(
      await this.pageService.permanentRemove(id, tenantId, userId),
    );
  }

  @Get(':id/export')
  async export(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Query() query: ExportPageQuery,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const format = (query?.format ?? 'markdown').toLowerCase();
    if (format !== 'markdown') throw new BadRequestException('format not supported');

    const result = await this.exportPageUseCase.export({
      tenantId,
      userId,
      spaceId,
      pageId: id,
      format: 'markdown',
    });

    if (!result) throw new NotFoundException('page not found');

    res.setHeader('Content-Type', `${result.contentType}; charset=utf-8`);
    return result.content;
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Query() query: GetPageQuery,
  ) {
    return new Response(
      await this.pageService.get(id, tenantId, {
        recordView: parseBooleanQuery(query?.trackView),
        actorUserId: userId,
      }),
    );
  }

  @Get()
  async list(
    @TenantId() tenantId: string,
    @Param('spaceId') spaceId: string,
    @Query() query: ListPageQuery,
  ) {
    return new ListResponse(
      await this.pageService.list(tenantId, spaceId, query),
    );
  }
}
