import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { SavePageDto } from './dto/save-page.dto';
import { PageService } from './page.service';
import { RagIndexService } from '../rag/rag.index.service';
import { ListPageQuery } from './dto/list-page.query';
import { ListPageTreeQuery } from './dto/list-page-tree.query';
import { ListResponse, Response } from '@contexta/shared';

@Controller('spaces/:spaceId/pages')
export class PageController {
  constructor(
    private readonly pageService: PageService,
    private readonly ragIndexService: RagIndexService,
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

  @Get(':id')
  async get(@Param('id') id: string, @TenantId() tenantId: string) {
    return new Response(
      await this.pageService.get(id, tenantId),
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
