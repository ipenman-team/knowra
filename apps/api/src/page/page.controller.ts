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

@Controller('spaces/:spaceId/pages')
export class PageController {
  constructor(
    private readonly pageService: PageService,
    private readonly ragIndexService: RagIndexService,
  ) {}

  @Post()
  create(
    @TenantId() tenantId: string,
    @Param('spaceId') spaceId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreatePageDto,
  ) {
    return this.pageService.create(tenantId, { ...body, spaceId }, userId);
  }

  @Put(':id')
  save(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
    @Body() body: SavePageDto,
  ) {
    return this.pageService.save(tenantId, id, body, userId);
  }

  @Post(':id/rename')
  rename(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    return this.pageService.rename(tenantId, id, body, userId);
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

      return published;
    })();
  }

  @Get(':id/versions')
  listVersions(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.pageService.listVersions(id, tenantId);
  }

  @Get(':id/versions/:versionId')
  getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @TenantId() tenantId: string,
  ) {
    return this.pageService.getVersion(id, versionId, tenantId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
  ) {
    return this.pageService.remove(id, tenantId, userId);
  }

  @Get('tree')
  listTree(
    @TenantId() tenantId: string,
    @Param('spaceId') spaceId: string,
    @Query() query: ListPageTreeQuery,
  ) {
    return this.pageService.listTree(tenantId, spaceId, query);
  }

  @Get(':id')
  get(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.pageService.get(id, tenantId);
  }

  @Get()
  list(
    @TenantId() tenantId: string,
    @Param('spaceId') spaceId: string,
    @Query() query: ListPageQuery,
  ) {
    return this.pageService.list(tenantId, spaceId, query);
  }
}
