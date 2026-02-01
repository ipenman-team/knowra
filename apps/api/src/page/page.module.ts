import { Module } from '@nestjs/common';
import { PageController } from './page.controller';
import { PageVersionController } from './page-version.controller';
import { PageService } from './page.service';
import { PageVersionService } from './page-version.service';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [RagModule],
  controllers: [PageController, PageVersionController],
  providers: [PageService, PageVersionService],
  exports: [PageService],
})
export class PageModule {}
