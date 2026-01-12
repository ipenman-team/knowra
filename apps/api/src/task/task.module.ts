import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskRuntimeService } from './task.runtime.service';
import { TaskService } from './task.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, TaskRuntimeService],
  exports: [TaskService, TaskRuntimeService],
})
export class TaskModule {}
