import { Module } from '@nestjs/common';
import { PageModule } from '../page/page.module';
import { TaskModule } from '../task/task.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [TaskModule, PageModule],
  controllers: [ImportsController],
  providers: [ImportsService],
})
export class ImportsModule {}
