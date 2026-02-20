import { Module } from '@nestjs/common';
import {
  CommentThreadSummaryUseCase,
  CreateCommentThreadUseCase,
  GetCommentThreadUseCase,
  ListCommentMessagesUseCase,
  ListCommentThreadsUseCase,
  ModerateCommentContentUseCase,
  ReplyCommentThreadUseCase,
  ResolveCommentThreadUseCase,
} from '@knowra/application';
import {
  PrismaCommentModerationLogRepository,
  PrismaCommentRepository,
} from '@knowra/infrastructure';
import { PageModule } from '../page/page.module';
import { PrismaService } from '../prisma/prisma.service';
import { ShareModule } from '../share/share.module';
import {
  COMMENT_MODERATION_LOG_REPOSITORY,
  COMMENT_REPOSITORY,
} from './comment.tokens';
import { CommentController, PublicCommentController } from './comment.controller';

@Module({
  imports: [PageModule, ShareModule],
  controllers: [CommentController, PublicCommentController],
  providers: [
    {
      provide: COMMENT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaCommentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: COMMENT_MODERATION_LOG_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaCommentModerationLogRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ModerateCommentContentUseCase,
      useFactory: () => new ModerateCommentContentUseCase(),
    },
    {
      provide: CreateCommentThreadUseCase,
      useFactory: (
        repo: PrismaCommentRepository,
        moderationLogRepo: PrismaCommentModerationLogRepository,
        moderateUseCase: ModerateCommentContentUseCase,
      ) => new CreateCommentThreadUseCase(repo, moderationLogRepo, moderateUseCase),
      inject: [
        COMMENT_REPOSITORY,
        COMMENT_MODERATION_LOG_REPOSITORY,
        ModerateCommentContentUseCase,
      ],
    },
    {
      provide: ReplyCommentThreadUseCase,
      useFactory: (
        repo: PrismaCommentRepository,
        moderationLogRepo: PrismaCommentModerationLogRepository,
        moderateUseCase: ModerateCommentContentUseCase,
      ) => new ReplyCommentThreadUseCase(repo, moderationLogRepo, moderateUseCase),
      inject: [
        COMMENT_REPOSITORY,
        COMMENT_MODERATION_LOG_REPOSITORY,
        ModerateCommentContentUseCase,
      ],
    },
    {
      provide: ListCommentThreadsUseCase,
      useFactory: (repo: PrismaCommentRepository) =>
        new ListCommentThreadsUseCase(repo),
      inject: [COMMENT_REPOSITORY],
    },
    {
      provide: ListCommentMessagesUseCase,
      useFactory: (repo: PrismaCommentRepository) =>
        new ListCommentMessagesUseCase(repo),
      inject: [COMMENT_REPOSITORY],
    },
    {
      provide: CommentThreadSummaryUseCase,
      useFactory: (repo: PrismaCommentRepository) =>
        new CommentThreadSummaryUseCase(repo),
      inject: [COMMENT_REPOSITORY],
    },
    {
      provide: GetCommentThreadUseCase,
      useFactory: (repo: PrismaCommentRepository) => new GetCommentThreadUseCase(repo),
      inject: [COMMENT_REPOSITORY],
    },
    {
      provide: ResolveCommentThreadUseCase,
      useFactory: (repo: PrismaCommentRepository) =>
        new ResolveCommentThreadUseCase(repo),
      inject: [COMMENT_REPOSITORY],
    },
  ],
  exports: [
    CreateCommentThreadUseCase,
    ReplyCommentThreadUseCase,
    ListCommentThreadsUseCase,
    ListCommentMessagesUseCase,
    CommentThreadSummaryUseCase,
  ],
})
export class CommentModule {}
