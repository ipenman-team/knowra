import { Module } from '@nestjs/common';
import { PageModule } from '../page/page.module';
import {
  CreateShareAccessLogUseCase,
  CreateShareSnapshotUseCase,
  CreateShareUseCase,
  GetLatestShareSnapshotUseCase,
  GetShareAccessUseCase,
  GetShareByIdUseCase,
  ListSharesUseCase,
  UpdateShareStatusUseCase,
} from '@contexta/application';
import {
  PrismaShareAccessLogRepository,
  PrismaShareRepository,
  PrismaShareSnapshotRepository,
} from '@contexta/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import {
  SHARE_ACCESS_LOG_REPOSITORY,
  SHARE_REPOSITORY,
  SHARE_SNAPSHOT_REPOSITORY,
} from './share.tokens';
import { ShareController } from './share.controller';

@Module({
  imports: [PageModule],
  controllers: [ShareController],
  providers: [
    {
      provide: SHARE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaShareRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: SHARE_SNAPSHOT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaShareSnapshotRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: SHARE_ACCESS_LOG_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaShareAccessLogRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: CreateShareUseCase,
      useFactory: (repo: PrismaShareRepository) => new CreateShareUseCase(repo),
      inject: [SHARE_REPOSITORY],
    },
    {
      provide: ListSharesUseCase,
      useFactory: (repo: PrismaShareRepository) => new ListSharesUseCase(repo),
      inject: [SHARE_REPOSITORY],
    },
    {
      provide: UpdateShareStatusUseCase,
      useFactory: (repo: PrismaShareRepository) => new UpdateShareStatusUseCase(repo),
      inject: [SHARE_REPOSITORY],
    },
    {
      provide: CreateShareSnapshotUseCase,
      useFactory: (
        shareRepo: PrismaShareRepository,
        snapshotRepo: PrismaShareSnapshotRepository,
      ) => new CreateShareSnapshotUseCase(shareRepo, snapshotRepo),
      inject: [SHARE_REPOSITORY, SHARE_SNAPSHOT_REPOSITORY],
    },
    {
      provide: GetLatestShareSnapshotUseCase,
      useFactory: (repo: PrismaShareSnapshotRepository) =>
        new GetLatestShareSnapshotUseCase(repo),
      inject: [SHARE_SNAPSHOT_REPOSITORY],
    },
    {
      provide: GetShareAccessUseCase,
      useFactory: (repo: PrismaShareRepository) => new GetShareAccessUseCase(repo),
      inject: [SHARE_REPOSITORY],
    },
    {
      provide: GetShareByIdUseCase,
      useFactory: (repo: PrismaShareRepository) => new GetShareByIdUseCase(repo),
      inject: [SHARE_REPOSITORY],
    },
    {
      provide: CreateShareAccessLogUseCase,
      useFactory: (repo: PrismaShareAccessLogRepository) =>
        new CreateShareAccessLogUseCase(repo),
      inject: [SHARE_ACCESS_LOG_REPOSITORY],
    },
  ],
})
export class ShareModule {}
