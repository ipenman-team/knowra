import { Module } from '@nestjs/common';
import {
  AiChatUseCase,
  AiConversationUseCase,
  AiMessageUseCase,
  DefaultPromptConfigProvider,
} from '@contexta/application';
import {
  PrismaAiConversationRepository,
  PrismaAiMessageRepository,
} from '@contexta/infrastructure';
import { OpenAICompatibleChatProvider } from '@contexta/rag';
import { PrismaService } from '../prisma/prisma.service';
import {
  AI_CHAT_PROVIDER,
  AI_CONVERSATION_REPOSITORY,
  AI_MESSAGE_REPOSITORY,
  AI_PROMPT_CONFIG_PROVIDER,
} from './ai-chat.tokens';
import { ConversationsController } from './conversations.controller';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ConversationsController, ChatController],
  providers: [
    {
      provide: AI_CONVERSATION_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaAiConversationRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: AI_MESSAGE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaAiMessageRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: AI_CHAT_PROVIDER,
      useFactory: () => {
        const apiKey = process.env.VOLCENGINE_API_KEY || '';
        const baseUrl = process.env.VOLC_BASE_URL || '';
        const model = process.env.VOLC_CHAT_MODEL || '';

        if (!apiKey) throw new Error('VOLCENGINE_API_KEY is required');
        if (!baseUrl) throw new Error('VOLC_BASE_URL is required');
        if (!model) throw new Error('VOLC_CHAT_MODEL is required');

        return new OpenAICompatibleChatProvider({ apiKey, baseUrl, model });
      },
    },
    {
      provide: AI_PROMPT_CONFIG_PROVIDER,
      useFactory: () => {
        const rawPrompt = process.env.CONTEXTA_AI_SYSTEM_PROMPT;
        const prompt = typeof rawPrompt === 'string' && rawPrompt.trim()
          ? rawPrompt.replace(/\\n/g, '\n').trim()
          : undefined;

        const rawWindow = process.env.CONTEXTA_AI_CONTEXT_WINDOW_SIZE;
        const windowSize = rawWindow ? Number(rawWindow) : undefined;
        const contextWindowSize = Number.isFinite(windowSize)
          ? Math.max(1, Math.floor(windowSize as number))
          : undefined;

        return new DefaultPromptConfigProvider({
          systemPrompt: prompt,
          contextWindowSize,
        });
      },
    },
    {
      provide: AiConversationUseCase,
      useFactory: (repo: PrismaAiConversationRepository) =>
        new AiConversationUseCase(repo),
      inject: [AI_CONVERSATION_REPOSITORY],
    },
    {
      provide: AiMessageUseCase,
      useFactory: (
        conversationRepo: PrismaAiConversationRepository,
        messageRepo: PrismaAiMessageRepository,
      ) => new AiMessageUseCase(conversationRepo, messageRepo),
      inject: [AI_CONVERSATION_REPOSITORY, AI_MESSAGE_REPOSITORY],
    },
    {
      provide: AiChatUseCase,
      useFactory: (
        conversationRepo: PrismaAiConversationRepository,
        messageRepo: PrismaAiMessageRepository,
        chatProvider: OpenAICompatibleChatProvider,
        promptConfigProvider: DefaultPromptConfigProvider,
      ) =>
        new AiChatUseCase(
          conversationRepo,
          messageRepo,
          chatProvider,
          promptConfigProvider,
        ),
      inject: [
        AI_CONVERSATION_REPOSITORY,
        AI_MESSAGE_REPOSITORY,
        AI_CHAT_PROVIDER,
        AI_PROMPT_CONFIG_PROVIDER,
      ],
    },
    ConversationService,
    MessageService,
    ChatService,
  ],
})
export class AiChatModule {}
