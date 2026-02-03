import { Module } from '@nestjs/common';
import {
  AiConversationUseCase,
  AiMessageUseCase,
} from '@contexta/application';
import {
  PrismaAiConversationRepository,
  PrismaAiMessageRepository,
} from '@contexta/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import {
  AI_CONVERSATION_REPOSITORY,
  AI_MESSAGE_REPOSITORY,
} from './ai-chat.tokens';
import { ConversationsController } from './conversations.controller';

@Module({
  controllers: [ConversationsController],
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
  ],
})
export class AiChatModule {}
