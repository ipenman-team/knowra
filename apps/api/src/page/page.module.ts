import { Module } from '@nestjs/common';
import { PageController } from './page.controller';
import { PageVersionController } from './page-version.controller';
import { PageService } from './page.service';
import { PageVersionService } from './page-version.service';
import { RagModule } from '../rag/rag.module';
import { PrismaService } from '../prisma/prisma.service';
import { ExportPageUseCase } from '@contexta/application';
import { PrismaPageExportRepository } from '@contexta/infrastructure';
import { PAGE_EXPORT_REPOSITORY } from './page.tokens';

@Module({
  imports: [RagModule],
  controllers: [PageController, PageVersionController],
  providers: [
    PageService,
    PageVersionService,
    {
      provide: PAGE_EXPORT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPageExportRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ExportPageUseCase,
      useFactory: (repo: PrismaPageExportRepository) => new ExportPageUseCase(repo),
      inject: [PAGE_EXPORT_REPOSITORY],
    },
  ],
  exports: [PageService],
})
export class PageModule {}
