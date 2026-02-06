import { Global, Module } from '@nestjs/common';
import { ActivityQueryUseCase, ActivityRecorderUseCase } from '@contexta/application';
import { PrismaActivityRepository } from '@contexta/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import { PAGE_ACTIVITY_ACTION_NAME_MAP } from '../page/constant';
import { SPACE_ACTIVITY_ACTION_NAME_MAP } from '../space/constant';
import { ACTIVITY_ACTION_NAME_MAP, ACTIVITY_REPOSITORY } from './activity.tokens';
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
    {
      provide: ACTIVITY_ACTION_NAME_MAP,
      useValue: {
        ...SPACE_ACTIVITY_ACTION_NAME_MAP,
        ...PAGE_ACTIVITY_ACTION_NAME_MAP,
      } satisfies Record<string, string>,
    },
  ],
  exports: [ActivityRecorderUseCase, ActivityQueryUseCase, ACTIVITY_ACTION_NAME_MAP],
})
export class ActivityModule {}
