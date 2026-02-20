import { Injectable } from '@nestjs/common';
import { AiMessageUseCase } from '@knowra/application';

@Injectable()
export class MessageService {
  constructor(private readonly useCase: AiMessageUseCase) {}

  listByConversation(params: {
    tenantId: string;
    conversationId: string;
    limit?: number | null;
  }) {
    return this.useCase.listByConversation(params);
  }
}
