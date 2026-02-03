import { Module } from '@nestjs/common';
import {
  AiKnowledgeSearchUseCase,
  type AiKnowledgeSearcher,
} from '@contexta/application';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeController } from './knowledge.controller';
import { AI_KNOWLEDGE_SEARCHER } from './knowledge.tokens';
import {
  DisabledAiKnowledgeSearcher,
  PrismaVectorAiKnowledgeSearcher,
} from './ai-knowledge-searcher';

@Module({
  controllers: [KnowledgeController],
  providers: [
    {
      provide: AI_KNOWLEDGE_SEARCHER,
      useFactory: (prisma: PrismaService): AiKnowledgeSearcher => {
        const apiKey = process.env.VOLCENGINE_API_KEY || '';
        const baseUrl = process.env.VOLC_BASE_URL || '';
        const embedModel = process.env.VOLC_EMBED_MODEL || '';

        if (!apiKey || !baseUrl || !embedModel) {
          return new DisabledAiKnowledgeSearcher();
        }

        const vectorDim = Number(process.env.RAG_VECTOR_DIM ?? 2560);
        const topK = Number(process.env.RAG_TOP_K ?? 8);
        const similarityThreshold = Number(process.env.RAG_SIMILARITY_THRESHOLD ?? 0.35);

        return new PrismaVectorAiKnowledgeSearcher(prisma, {
          apiKey,
          baseUrl,
          embedModel,
          vectorDim: Number.isFinite(vectorDim) ? vectorDim : 2560,
          defaultTopK: Number.isFinite(topK) ? topK : 8,
          similarityThreshold: Number.isFinite(similarityThreshold) ? similarityThreshold : 0.35,
        });
      },
      inject: [PrismaService],
    },
    {
      provide: AiKnowledgeSearchUseCase,
      useFactory: (searcher: AiKnowledgeSearcher) =>
        new AiKnowledgeSearchUseCase(searcher),
      inject: [AI_KNOWLEDGE_SEARCHER],
    },
  ],
  exports: [AI_KNOWLEDGE_SEARCHER],
})
export class KnowledgeModule {}
