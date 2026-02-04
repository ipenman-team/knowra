import { Injectable } from '@nestjs/common';
import { AiChatUseCase } from '@contexta/application';

@Injectable()
export class ChatService {
  constructor(private readonly useCase: AiChatUseCase) {}

  answer(params: {
    tenantId: string;
    conversationId: string;
    message: string;
    actorUserId: string;
    dataSource?: {
      internetEnabled?: boolean;
      spaceEnabled?: boolean;
      spaceIds?: string[];
    };
  }) {
    return this.useCase.answer(params);
  }

  answerStream(params: {
    tenantId: string;
    conversationId: string;
    message: string;
    actorUserId: string;
    signal?: AbortSignal;
  }) {
    return this.useCase.answerStream(params);
  }
}
