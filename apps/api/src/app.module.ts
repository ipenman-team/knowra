import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PageModule } from './page/page.module';
import { SpaceModule } from './space/space.module';
import { PrismaModule } from './prisma/prisma.module';
import { TenantMiddleware } from './common/tenant/tenant.middleware';
import { LocaleMiddleware } from './common/i18n/locale.middleware';
import { TaskModule } from './task/task.module';
import { ImportsModule } from './imports/imports.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { UserModule } from './user/user.module';
import { ActivityModule } from './activity/activity.module';
import { DailyCopyModule } from './daily-copy/daily-copy.module';
import { ShareModule } from './share/share.module';
import { SiteBuilderModule } from './site-builder/site-builder.module';
import { FavoriteModule } from './favorite/favorite.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '../../.env.prod'),
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '../../.env.local'),
        path.resolve(process.cwd(), '.env.prod'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '.env.local'),
      ],
    }),
    PrismaModule,
    PageModule,
    SpaceModule,
    TaskModule,
    ImportsModule,
    AuthModule,
    UserModule,
    FilesModule,
    ActivityModule,
    DailyCopyModule,
    ShareModule,
    SiteBuilderModule,
    FavoriteModule,
  ],
  controllers: [AppController],
  providers: [AppService, TenantMiddleware, LocaleMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LocaleMiddleware, TenantMiddleware).forRoutes('*');
  }
}
