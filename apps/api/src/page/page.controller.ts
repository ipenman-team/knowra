import { Body, Controller, Delete, Get, Headers, Param, Post, Put } from '@nestjs/common';
import { TenantId } from '../common/tenant/tenant-id.decorator';
import { CreatePageDto } from './dto/create-page.dto';
import { SavePageDto } from './dto/save-page.dto';
import { PageService } from './page.service';

@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  create(
    @TenantId() tenantId: string,
    @Headers('x-user-id') userId: string | undefined,
    @Body() body: CreatePageDto,
  ) {
    return this.pageService.create(tenantId, body, userId);
  }

  @Put(':id')
  save(
    @TenantId() tenantId: string,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
    @Body() body: SavePageDto,
  ) {
    return this.pageService.save(tenantId, id, body, userId);
  }

  @Post(':id/publish')
  publish(
    @TenantId() tenantId: string,
    @Headers('x-user-id') userId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.pageService.publish(tenantId, id, userId);
  }

  @Get(':id/published')
  getLatestPublished(@Param('id') id: string, @TenantId() tenantId: string) {
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
