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
import { SpaceService } from './space.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { ListSpaceQuery } from './dto/list-space.query';
import { RenameSpaceDto } from './dto/rename-space.dto';
import { SetSpaceFavoriteDto } from './dto/set-space-favorite.dto';

@Controller('spaces')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @Post()
  async createSpace(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreateSpaceDto,
  ) {
    const space = await this.spaceService.create(tenantId, body, userId);
    return { ok: true, space };
  }

  @Get()
  async getSpaces(@TenantId() tenantId: string, @Query() query: ListSpaceQuery) {
    return this.spaceService.list(tenantId, query);
  }

  @Get(':id')
  async getSpaceById(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.spaceService.get(tenantId, id);
  }

  @Put(':id')
  async updateSpace(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateSpaceDto,
  ) {
    const space = await this.spaceService.update(tenantId, id, body, userId);
    return { ok: true, space };
  }

  @Put(':id/rename')
  async renameSpace(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
    @Body() body: RenameSpaceDto,
  ) {
    const space = await this.spaceService.rename(tenantId, id, body, userId);
    return { ok: true, space };
  }

  @Put(':id/favorite')
  async setSpaceFavorite(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
    @Body() body: SetSpaceFavoriteDto,
  ) {
    const result = await this.spaceService.setFavorite(
      tenantId,
      id,
      body,
      userId,
    );
    return { ok: true, ...result };
  }

  @Delete(':id')
  async deleteSpace(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('id') id: string,
  ) {
    return this.spaceService.remove(tenantId, id, userId);
  }
}
