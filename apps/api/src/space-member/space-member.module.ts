import { Module } from '@nestjs/common';
import {
  BatchRemoveMembersUseCase,
  BatchUpdateMemberRoleUseCase,
  ListSpaceMembersUseCase,
  RemoveMemberUseCase,
  UpdateMemberRoleUseCase,
} from '@knowra/application';
import {
  PrismaSpaceMemberRepository,
  PrismaSpaceRoleRepository,
} from '@knowra/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import { SPACE_ROLE_REPOSITORY } from '../space-role/space-role.tokens';
import { SpaceMemberController } from './space-member.controller';
import { SPACE_MEMBER_REPOSITORY } from './space-member.tokens';

@Module({
  controllers: [SpaceMemberController],
  providers: [
    {
      provide: SPACE_MEMBER_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSpaceMemberRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: SPACE_ROLE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSpaceRoleRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListSpaceMembersUseCase,
      useFactory: (
        memberRepo: PrismaSpaceMemberRepository,
        roleRepo: PrismaSpaceRoleRepository,
      ) => new ListSpaceMembersUseCase(memberRepo, roleRepo),
      inject: [SPACE_MEMBER_REPOSITORY, SPACE_ROLE_REPOSITORY],
    },
    {
      provide: UpdateMemberRoleUseCase,
      useFactory: (
        memberRepo: PrismaSpaceMemberRepository,
        roleRepo: PrismaSpaceRoleRepository,
      ) => new UpdateMemberRoleUseCase(memberRepo, roleRepo),
      inject: [SPACE_MEMBER_REPOSITORY, SPACE_ROLE_REPOSITORY],
    },
    {
      provide: BatchUpdateMemberRoleUseCase,
      useFactory: (
        memberRepo: PrismaSpaceMemberRepository,
        roleRepo: PrismaSpaceRoleRepository,
      ) => new BatchUpdateMemberRoleUseCase(memberRepo, roleRepo),
      inject: [SPACE_MEMBER_REPOSITORY, SPACE_ROLE_REPOSITORY],
    },
    {
      provide: RemoveMemberUseCase,
      useFactory: (
        memberRepo: PrismaSpaceMemberRepository,
        roleRepo: PrismaSpaceRoleRepository,
      ) => new RemoveMemberUseCase(memberRepo, roleRepo),
      inject: [SPACE_MEMBER_REPOSITORY, SPACE_ROLE_REPOSITORY],
    },
    {
      provide: BatchRemoveMembersUseCase,
      useFactory: (
        memberRepo: PrismaSpaceMemberRepository,
        roleRepo: PrismaSpaceRoleRepository,
      ) => new BatchRemoveMembersUseCase(memberRepo, roleRepo),
      inject: [SPACE_MEMBER_REPOSITORY, SPACE_ROLE_REPOSITORY],
    },
  ],
})
export class SpaceMemberModule {}
