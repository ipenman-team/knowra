import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOriginEnv = process.env.CORS_ORIGIN?.trim();
  const corsOrigin = corsOriginEnv
    ? corsOriginEnv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : true;

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Avoid port conflict with Next.js dev server (default 3000) and apps/api (default 3001).
  await app.listen(process.env.PORT ?? 3002);
}

void bootstrap();
