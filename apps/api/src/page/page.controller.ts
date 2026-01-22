import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { SavePageDto } from './dto/save-page.dto';
import { PageService } from './page.service';
import { RagIndexService } from '../rag/rag.index.service';

@Controller('pages')
export class PageController {
  constructor(
    private readonly pageService: PageService,
    private readonly ragIndexService: RagIndexService,
  ) {}

  @Post()
  create(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreatePageDto,
  ) {
    return this.pageService.create(tenantId, body, userId);
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

      // Publish 后索引：后台 fire-and-forget
      // 其他同步时机（保留思路）：启动时全量同步、定时任务每日同步、DB hook/CDC 等。
      this.ragIndexService.startIndexPublished({
        tenantId,
        pageId: id,
        pageVersionId: published.versionId,
      });

      return published;
    })();
  }

  @Get(':id/published')
  getLatestPublished(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.pageService.getLatestPublished(id, tenantId);
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
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.pageService.remove(id, tenantId);
  }

  @Get(':id')
  get(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.pageService.get(id, tenantId);
  }

  @Get()
  list(@TenantId() tenantId: string) {
    return this.pageService.list(tenantId);
  }
}
