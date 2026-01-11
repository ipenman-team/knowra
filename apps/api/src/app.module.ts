import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PageModule } from './page/page.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, PageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
