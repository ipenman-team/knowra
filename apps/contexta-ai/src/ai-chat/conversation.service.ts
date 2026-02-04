import { Injectable } from '@nestjs/common';
import { AiConversationUseCase } from '@contexta/application';

@Injectable()
export class ConversationService {
  constructor(private readonly useCase: AiConversationUseCase) {}

  create(params: {
    tenantId: string;
    title?: string | null;
    actorUserId: string;
  }) {
    return this.useCase.create(params);
  }

  list(params: { tenantId: string; limit?: number | null }) {
    return this.useCase.list(params);
  }

  renameTitle(params: {
    tenantId: string;
    conversationId: string;
    title?: string | null;
    actorUserId: string;
  }) {
    return this.useCase.renameTitle(params);
  }

  getSources(params: { tenantId: string; conversationId: string }) {
    return this.useCase.getSources(params);
  }

  updateSources(params: {
    tenantId: string;
    conversationId: string;
    internetEnabled: boolean;
    spaceEnabled: boolean;
    spaceIds: string[];
    actorUserId: string;
  }) {
    return this.useCase.updateSources(params);
  }
}
