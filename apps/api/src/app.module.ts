import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PageModule } from './page/page.module';
import { PrismaModule } from './prisma/prisma.module';
import { tenantMiddleware } from './common/tenant/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '../../.env.local'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '.env.local'),
      ],
    }),
    PrismaModule,
    PageModule,
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(tenantMiddleware).forRoutes('*');
  }
}
