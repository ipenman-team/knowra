import { Module } from '@nestjs/common';
import {
  AcceptSpaceInvitationUseCase,
  CreateSpaceEmailInvitationsUseCase,
  CreateSpaceLinkInvitationUseCase,
  ListSpaceInvitationsUseCase,
  ResendSpaceInvitationUseCase,
} from '@knowra/application';
import { PrismaSpaceInvitationRepository } from '@knowra/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import {
  SpaceInvitationAcceptController,
  SpaceInvitationController,
} from './space-invitation.controller';
import { SPACE_INVITATION_REPOSITORY } from './space-invitation.tokens';

@Module({
  controllers: [SpaceInvitationController, SpaceInvitationAcceptController],
  providers: [
    {
      provide: SPACE_INVITATION_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaSpaceInvitationRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateSpaceEmailInvitationsUseCase,
      useFactory: (repo: PrismaSpaceInvitationRepository) =>
        new CreateSpaceEmailInvitationsUseCase(repo),
      inject: [SPACE_INVITATION_REPOSITORY],
    },
    {
      provide: CreateSpaceLinkInvitationUseCase,
      useFactory: (repo: PrismaSpaceInvitationRepository) =>
        new CreateSpaceLinkInvitationUseCase(repo),
      inject: [SPACE_INVITATION_REPOSITORY],
    },
    {
      provide: ListSpaceInvitationsUseCase,
      useFactory: (repo: PrismaSpaceInvitationRepository) =>
        new ListSpaceInvitationsUseCase(repo),
      inject: [SPACE_INVITATION_REPOSITORY],
    },
    {
      provide: ResendSpaceInvitationUseCase,
      useFactory: (repo: PrismaSpaceInvitationRepository) =>
        new ResendSpaceInvitationUseCase(repo),
      inject: [SPACE_INVITATION_REPOSITORY],
    },
    {
      provide: AcceptSpaceInvitationUseCase,
      useFactory: (repo: PrismaSpaceInvitationRepository) =>
        new AcceptSpaceInvitationUseCase(repo),
      inject: [SPACE_INVITATION_REPOSITORY],
    },
  ],
})
export class SpaceInvitationModule {}
