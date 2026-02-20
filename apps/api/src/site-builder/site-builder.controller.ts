import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from '@knowra/shared';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import { PublishSiteBuilderDto } from './dto/publish-site-builder.dto';
import { SaveSiteBuilderDraftDto } from './dto/save-site-builder-draft.dto';
import { SiteBuilderService } from './site-builder.service';

@Controller('spaces/:spaceId/site-builder')
export class SiteBuilderController {
  constructor(private readonly siteBuilderService: SiteBuilderService) {}

  @Get()
  async get(
    @TenantId() tenantId: string,
    @Param('spaceId') spaceId: string,
  ) {
    return new Response(await this.siteBuilderService.get(tenantId, spaceId));
  }

  @Put('draft')
  async saveDraft(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Body() body: SaveSiteBuilderDraftDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');
    if (!body) throw new BadRequestException('body is required');

    const config = await this.siteBuilderService.saveDraft(
      tenantId,
      spaceId,
      userId,
      body.config,
    );
    return new Response(config);
  }

  @Post('publish')
  async publish(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Body() body: PublishSiteBuilderDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    return new Response(
      await this.siteBuilderService.publish(
        tenantId,
        spaceId,
        userId,
        body ?? {},
      ),
    );
  }

  @Post('unpublish')
  async unpublish(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    return new Response(
      await this.siteBuilderService.unpublish(tenantId, spaceId, userId),
    );
  }
}

