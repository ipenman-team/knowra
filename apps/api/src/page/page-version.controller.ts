import { Controller, Get, Param } from '@nestjs/common';

import { TenantId } from '../common/tenant/tenant-id.decorator';
import { PageVersionService } from './page-version.service';

@Controller('pages/:pageId')
export class PageVersionController {
  constructor(private readonly pageVersionService: PageVersionService) {}

  @Get('versions')
  listVersions(
    @TenantId() tenantId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.pageVersionService.listVersions(pageId, tenantId);
  }

  @Get('versions/:versionId')
  getVersion(
    @TenantId() tenantId: string,
    @Param('pageId') pageId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.pageVersionService.getVersion(pageId, versionId, tenantId);
  }
}
