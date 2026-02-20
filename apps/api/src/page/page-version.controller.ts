import { Controller, Get, Param } from '@nestjs/common';

import { TenantId } from '../common/tenant/tenant-id.decorator';
import { PageVersionService } from './page-version.service';
import { ListResponse, Response } from '@knowra/shared';

@Controller('pages/:pageId')
export class PageVersionController {
  constructor(private readonly pageVersionService: PageVersionService) {}

  @Get('versions')
  async listVersions(
    @TenantId() tenantId: string,
    @Param('pageId') pageId: string,
  ) {
    return new ListResponse(
      await this.pageVersionService.listVersions(pageId, tenantId),
    );
  }

  @Get('versions/:versionId')
  async getVersion(
    @TenantId() tenantId: string,
    @Param('pageId') pageId: string,
    @Param('versionId') versionId: string,
  ) {
    return new Response(
      await this.pageVersionService.getVersion(pageId, versionId, tenantId),
    );
  }
}
