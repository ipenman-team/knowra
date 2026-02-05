import { Global, Module } from '@nestjs/common';
import { ActivityQueryUseCase, ActivityRecorderUseCase } from '@contexta/application';
import { PrismaActivityRepository } from '@contexta/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import { ACTIVITY_REPOSITORY } from './activity.tokens';
import { ActivitiesController } from './activities.controller';

@Global()
@Module({
  controllers: [ActivitiesController],
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
