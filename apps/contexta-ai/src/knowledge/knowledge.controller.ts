import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { AiKnowledgeSearchUseCase } from '@contexta/application';
import { TenantId } from '../common/tenant/tenant-id.decorator';

type KnowledgeSearchBody = {
  query?: unknown;
  topK?: unknown;
  spaceId?: unknown;
};

@Controller('api/knowledge')
export class KnowledgeController {
  constructor(private readonly useCase: AiKnowledgeSearchUseCase) {}

  @Post('search')
  async search(
    @TenantId() tenantId: string,
    @Body() body: KnowledgeSearchBody,
  ) {
    const query = typeof body?.query === 'string' ? body.query : '';

    const topK =
      typeof body?.topK === 'number'
        ? body.topK
        : typeof body?.topK === 'string'
          ? Number(body.topK)
          : undefined;

    const spaceId = typeof body?.spaceId === 'string' ? body.spaceId : undefined;

    try {
      return await this.useCase.search({
        tenantId,
        query,
        topK: Number.isFinite(topK) ? (topK as number) : undefined,
        spaceId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'bad request';
      throw new BadRequestException(message);
    }
  }
}
