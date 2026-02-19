import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AcceptSpaceInvitationUseCase,
  CreateSpaceEmailInvitationsUseCase,
  CreateSpaceLinkInvitationUseCase,
  ListSpaceInvitationsUseCase,
  ListSpaceMembersUseCase,
  ResendSpaceInvitationUseCase,
} from '@contexta/application';
import type { SpaceInvitationStatusValue } from '@contexta/domain';
import { ListResponse, Response } from '@contexta/shared';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import type { AcceptSpaceInvitationDto } from './dto/accept-space-invitation.dto';
import type { CreateSpaceEmailInvitationsDto } from './dto/create-space-email-invitations.dto';
import type { CreateSpaceLinkInvitationDto } from './dto/create-space-link-invitation.dto';
import type { ListSpaceInvitationsQuery } from './dto/list-space-invitations.query';

function parseStatuses(
  raw: string | string[] | undefined,
): SpaceInvitationStatusValue[] {
  if (!raw) return [];
  const values = Array.isArray(raw)
    ? raw
    : raw.split(',');

  return values
    .map((item) => item.trim().toUpperCase())
    .filter((item) => Boolean(item)) as SpaceInvitationStatusValue[];
}

function throwUseCaseError(error: unknown): never {
  if (error instanceof BadRequestException) throw error;
  if (error instanceof ForbiddenException) throw error;
  if (error instanceof NotFoundException) throw error;

  const message = error instanceof Error ? error.message : String(error ?? '');
  if (message === 'permission denied') {
    throw new ForbiddenException('forbidden');
  }
  if (message === 'invitation not found') {
    throw new NotFoundException(message);
  }
  if (
    message === 'invitation expired' ||
    message === 'invitation revoked' ||
    message === 'invitation already accepted' ||
    message === 'invitation email mismatch'
  ) {
    throw new BadRequestException(message);
  }

  throw new BadRequestException(message || 'bad request');
}

@Controller('spaces/:spaceId')
export class SpaceInvitationController {
  constructor(
    private readonly createEmailInvitationsUseCase: CreateSpaceEmailInvitationsUseCase,
    private readonly createLinkInvitationUseCase: CreateSpaceLinkInvitationUseCase,
    private readonly listSpaceInvitationsUseCase: ListSpaceInvitationsUseCase,
    private readonly resendSpaceInvitationUseCase: ResendSpaceInvitationUseCase,
    private readonly listSpaceMembersUseCase: ListSpaceMembersUseCase,
  ) {}

  @Get('members')
  async listMembers(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const items = await this.listSpaceMembersUseCase.list({
        tenantId,
        spaceId,
        actorUserId: userId,
      });
      return new ListResponse(items);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Get('invitations')
  async listInvitations(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Query() query: ListSpaceInvitationsQuery,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const items = await this.listSpaceInvitationsUseCase.list({
        tenantId,
        spaceId,
        actorUserId: userId,
        statuses: parseStatuses(query.status),
      });
      return new ListResponse(items);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Post('invitations')
  async createEmailInvitations(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Body() body: CreateSpaceEmailInvitationsDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const items = await this.createEmailInvitationsUseCase.create({
        tenantId,
        spaceId,
        actorUserId: userId,
        emails: body.emails ?? [],
        role: body.role,
      });
      return new ListResponse(items);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Post('invitations/link')
  async createLinkInvitation(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Body() body: CreateSpaceLinkInvitationDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.createLinkInvitationUseCase.create({
        tenantId,
        spaceId,
        actorUserId: userId,
        role: body.role,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }

  @Post('invitations/:invitationId/resend')
  async resendInvitation(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('spaceId') spaceId: string,
    @Param('invitationId') invitationId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.resendSpaceInvitationUseCase.resend({
        tenantId,
        spaceId,
        invitationId,
        actorUserId: userId,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }
}

@Controller('space-invitations')
export class SpaceInvitationAcceptController {
  constructor(
    private readonly acceptSpaceInvitationUseCase: AcceptSpaceInvitationUseCase,
  ) {}

  @Post('accept')
  async accept(
    @UserId() userId: string | undefined,
    @Body() body: AcceptSpaceInvitationDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.acceptSpaceInvitationUseCase.accept({
        token: String(body.token ?? ''),
        actorUserId: userId,
      });
      return new Response(data);
    } catch (error) {
      throwUseCaseError(error);
    }
  }
}
