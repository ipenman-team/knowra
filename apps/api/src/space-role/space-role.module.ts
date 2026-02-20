import { Module } from '@nestjs/common';
import {
  CreateSpaceRoleUseCase,
  DeleteSpaceRoleUseCase,
  ListSpaceRolesUseCase,
  UpdateSpaceRoleUseCase,
} from '@contexta/application';
import { PrismaSpaceRoleRepository } from '@contexta/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import { SpaceRoleController } from './space-role.controller';
import { SPACE_ROLE_REPOSITORY } from './space-role.tokens';

@Module({
  controllers: [SpaceRoleController],
  providers: [
    {
      provide: SPACE_ROLE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSpaceRoleRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ListSpaceRolesUseCase,
      useFactory: (repo: PrismaSpaceRoleRepository) =>
        new ListSpaceRolesUseCase(repo),
      inject: [SPACE_ROLE_REPOSITORY],
    },
    {
      provide: CreateSpaceRoleUseCase,
      useFactory: (repo: PrismaSpaceRoleRepository) =>
        new CreateSpaceRoleUseCase(repo),
      inject: [SPACE_ROLE_REPOSITORY],
    },
    {
      provide: UpdateSpaceRoleUseCase,
      useFactory: (repo: PrismaSpaceRoleRepository) =>
        new UpdateSpaceRoleUseCase(repo),
      inject: [SPACE_ROLE_REPOSITORY],
    },
    {
      provide: DeleteSpaceRoleUseCase,
      useFactory: (repo: PrismaSpaceRoleRepository) =>
        new DeleteSpaceRoleUseCase(repo),
      inject: [SPACE_ROLE_REPOSITORY],
    },
  ],
})
export class SpaceRoleModule {}
