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
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  BatchRemoveMembersUseCase,
  BatchUpdateMemberRoleUseCase,
  ListSpaceMembersUseCase,
  RemoveMemberUseCase,
  UpdateMemberRoleUseCase,
} from '@knowra/application';
import { ListResponse, Response } from '@knowra/shared';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import type { BatchRemoveMembersDto, BatchUpdateMemberRoleDto } from './dto/batch-member.dto';
import type { ListSpaceMembersQuery } from './dto/list-space-members.query';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';

function throwUseCaseError(error: unknown): never {
  if (error instanceof BadRequestException) throw error;
  if (error instanceof ForbiddenException) throw error;
  if (error instanceof NotFoundException) throw error;

  const message = error instanceof Error ? error.message : String(error ?? '');

  if (message === 'permission denied') {
    throw new ForbiddenException('forbidden');
  }

  if (message === 'member not found' || message === 'role not found') {
    throw new NotFoundException(message);
  }

  if (
    message === 'owner member cannot be modified' ||
    message === 'owner member cannot be removed' ||
    message === 'memberIds is required' ||
    message === 'memberIds must be array' ||
    message.endsWith('is required')
  ) {
    throw new BadRequestException(message);
  }

  throw new BadRequestException(message || 'bad request');
}

@Controller('spaces/:spaceId/members')
export class SpaceMemberController {
  constructor(
    private readonly listSpaceMembersUseCase: ListSpaceMembersUseCase,
    private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase,
    private readonly batchUpdateMemberRoleUseCase: BatchUpdateMemberRoleUseCase,
    private readonly removeMemberUseCase: RemoveMemberUseCase,
    private readonly batchRemoveMembersUseCase: BatchRemoveMembersUseCase,
  ) {}

  @Get()
  async list(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Query() query: ListSpaceMembersQuery,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const result = await this.listSpaceMembersUseCase.list({
        tenantId,
        spaceId,
        actorUserId: userId,
        q: query.q,
        skip: query.skip,
        take: query.take,
      });

      return new ListResponse(result.items, undefined, {
        total: result.total,
        skip: result.skip,
        take: result.take,
      });
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Put(':memberId/role')
  async updateRole(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.updateMemberRoleUseCase.update({
        tenantId,
        spaceId,
        memberId,
        roleId: String(body?.roleId ?? ''),
        actorUserId: userId,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Put('batch-role')
  async batchUpdateRole(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Body() body: BatchUpdateMemberRoleDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.batchUpdateMemberRoleUseCase.update({
        tenantId,
        spaceId,
        memberIds: body?.memberIds ?? [],
        roleId: String(body?.roleId ?? ''),
        actorUserId: userId,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Delete(':memberId')
  async remove(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Param('memberId') memberId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.removeMemberUseCase.remove({
        tenantId,
        spaceId,
        memberId,
        actorUserId: userId,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Post('batch-remove')
  async batchRemove(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Body() body: BatchRemoveMembersDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.batchRemoveMembersUseCase.remove({
        tenantId,
        spaceId,
        memberIds: body?.memberIds ?? [],
        actorUserId: userId,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }
}
