import { Module } from '@nestjs/common';
import { PageModule } from '../page/page.module';
import { ShareModule } from '../share/share.module';
import { SiteBuilderController } from './site-builder.controller';
import { SiteBuilderService } from './site-builder.service';

@Module({
  imports: [PageModule, ShareModule],
  controllers: [SiteBuilderController],
  providers: [SiteBuilderService],
})
export class SiteBuilderModule {}
