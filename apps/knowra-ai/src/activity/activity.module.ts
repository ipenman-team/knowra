import { Global, Module } from '@nestjs/common';
import { ActivityQueryUseCase, ActivityRecorderUseCase } from '@knowra/application';
import { PrismaActivityRepository } from '@knowra/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import { ACTIVITY_REPOSITORY } from './activity.tokens';

@Global()
@Module({
  providers: [
    {
      provide: ACTIVITY_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaActivityRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ActivityRecorderUseCase,
      useFactory: (repo: PrismaActivityRepository) =>
        new ActivityRecorderUseCase(repo),
      inject: [ACTIVITY_REPOSITORY],
    },
    {
      provide: ActivityQueryUseCase,
      useFactory: (repo: PrismaActivityRepository) => new ActivityQueryUseCase(repo),
      inject: [ACTIVITY_REPOSITORY],
    },
  ],
  exports: [ActivityRecorderUseCase, ActivityQueryUseCase],
})
export class ActivityModule {}
