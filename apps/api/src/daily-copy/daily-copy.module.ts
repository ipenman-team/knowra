import { Global, Module } from '@nestjs/common';
import {
  GenerateTodayDailyCopyUseCase,
  SetTodayDailyCopyLikeUseCase,
} from '@knowra/application';
import { OpenAICompatibleChatProvider } from '@knowra/rag';
import { PrismaDailyCopyRepository } from '@knowra/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import {
  DAILY_COPY_CHAT_PROVIDER,
  DAILY_COPY_REPOSITORY,
} from './daily-copy.tokens';
import { DailyCopyController } from './daily-copy.controller';

@Global()
@Module({
  controllers: [DailyCopyController],
  providers: [
    {
      provide: DAILY_COPY_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaDailyCopyRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: DAILY_COPY_CHAT_PROVIDER,
      useFactory: () => {
        const apiKey = process.env.VOLCENGINE_API_KEY || '';
        const baseUrl = process.env.VOLC_BASE_URL || '';
        const model =
          process.env.DAILY_COPY_CHAT_MODEL ?? process.env.VOLC_CHAT_MODEL ?? '';

        if (!apiKey) throw new Error('VOLCENGINE_API_KEY is required');
        if (!baseUrl) throw new Error('VOLC_BASE_URL is required');
        if (!model) throw new Error('VOLC_CHAT_MODEL is required');

        return new OpenAICompatibleChatProvider({ apiKey, baseUrl, model });
      },
    },
    {
      provide: GenerateTodayDailyCopyUseCase,
      useFactory: (repo: PrismaDailyCopyRepository, chat: OpenAICompatibleChatProvider) =>
        new GenerateTodayDailyCopyUseCase(repo, chat),
      inject: [DAILY_COPY_REPOSITORY, DAILY_COPY_CHAT_PROVIDER],
    },
    {
      provide: SetTodayDailyCopyLikeUseCase,
      useFactory: (repo: PrismaDailyCopyRepository) =>
        new SetTodayDailyCopyLikeUseCase(repo),
      inject: [DAILY_COPY_REPOSITORY],
    },
  ],
  exports: [GenerateTodayDailyCopyUseCase, SetTodayDailyCopyLikeUseCase],
})
export class DailyCopyModule {}
