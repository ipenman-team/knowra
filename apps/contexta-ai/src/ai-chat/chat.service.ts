import { Injectable } from '@nestjs/common';
import { AiChatUseCase } from '@contexta/application';
import { AttachmentsService } from '../attachments/attachments.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly useCase: AiChatUseCase,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async answer(params: {
    tenantId: string;
    conversationId: string;
    message: string;
    actorUserId: string;
    attachmentIds?: string[];
  }) {
    const res = await this.attachmentsService.buildContext({
      tenantId: params.tenantId,
      query: params.message,
      attachmentIds: params.attachmentIds,
    });

    return this.useCase.answer({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      message: params.message,
      actorUserId: params.actorUserId,
      extraKnowledgeContext: res.context,
    });
  }

  async answerStream(params: {
    tenantId: string;
    conversationId: string;
    message: string;
    actorUserId: string;
    signal?: AbortSignal;
    attachmentIds?: string[];
  }) {
    const res = await this.attachmentsService.buildContext({
      tenantId: params.tenantId,
      query: params.message,
      attachmentIds: params.attachmentIds,
    });

    return this.useCase.answerStream({
      tenantId: params.tenantId,
      conversationId: params.conversationId,
      message: params.message,
      actorUserId: params.actorUserId,
      signal: params.signal,
      extraKnowledgeContext: res.context,
    });
  }
}
