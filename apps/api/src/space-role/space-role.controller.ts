import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateSpaceRoleUseCase,
  DeleteSpaceRoleUseCase,
  ListSpaceRolesUseCase,
  UpdateSpaceRoleUseCase,
} from '@knowra/application';
import { ListResponse, Response } from '@knowra/shared';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import type { CreateSpaceRoleDto } from './dto/create-space-role.dto';
import type { UpdateSpaceRoleDto } from './dto/update-space-role.dto';

function throwUseCaseError(error: unknown): never {
  if (error instanceof BadRequestException) throw error;
  if (error instanceof ForbiddenException) throw error;
  if (error instanceof NotFoundException) throw error;

  const message = error instanceof Error ? error.message : String(error ?? '');
  if (message === 'permission denied') {
    throw new ForbiddenException('forbidden');
  }

  if (message === 'role not found') {
    throw new NotFoundException(message);
  }
  if (message === 'space not found') {
    throw new NotFoundException(message);
  }

  if (
    message === 'role name already exists' ||
    message === 'owner role cannot be modified' ||
    message === 'built-in role name and description are read-only' ||
    message === 'built-in role cannot be deleted' ||
    message === 'member built-in role not found' ||
    message.startsWith('invalid permission') ||
    message === 'permissions must be array' ||
    message.endsWith('is required')
  ) {
    throw new BadRequestException(message);
  }

  throw new BadRequestException(message || 'bad request');
}

@Controller('spaces/:spaceId/roles')
export class SpaceRoleController {
  constructor(
    private readonly listSpaceRolesUseCase: ListSpaceRolesUseCase,
    private readonly createSpaceRoleUseCase: CreateSpaceRoleUseCase,
    private readonly updateSpaceRoleUseCase: UpdateSpaceRoleUseCase,
    private readonly deleteSpaceRoleUseCase: DeleteSpaceRoleUseCase,
  ) {}

  @Get()
  async list(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const items = await this.listSpaceRolesUseCase.list({
        tenantId,
        spaceId,
        actorUserId: userId,
      });
      return new ListResponse(items);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Post()
  async create(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Body() body: CreateSpaceRoleDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.createSpaceRoleUseCase.create({
        tenantId,
        spaceId,
        actorUserId: userId,
        name: String(body?.name ?? ''),
        description: body?.description,
        permissions: Array.isArray(body?.permissions) ? body.permissions : [],
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Put(':roleId')
  async update(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Param('roleId') roleId: string,
    @Body() body: UpdateSpaceRoleDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.updateSpaceRoleUseCase.update({
        tenantId,
        spaceId,
        roleId,
        actorUserId: userId,
        name: body?.name,
        description: body?.description,
        permissions: body?.permissions,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Delete(':roleId')
  async remove(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Param('roleId') roleId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.deleteSpaceRoleUseCase.delete({
        tenantId,
        spaceId,
        roleId,
        actorUserId: userId,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }
}
