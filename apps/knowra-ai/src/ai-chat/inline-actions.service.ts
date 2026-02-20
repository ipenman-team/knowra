import { Injectable } from '@nestjs/common';
import type { InlineActionType } from '@knowra/application';
import { InlineActionUseCase } from '@knowra/application';

@Injectable()
export class InlineActionsService {
  constructor(private readonly useCase: InlineActionUseCase) {}

  stream(params: {
    tenantId: string;
    actorUserId: string;
    selectedText: string;
    actionType: InlineActionType;
    userPrompt?: string;
    actionParams?: {
      targetLanguage?: string;
    };
    context?: {
      pageId?: string;
      spaceId?: string;
      mode: 'edit' | 'readonly';
    };
    signal?: AbortSignal;
  }): AsyncIterable<string> {
    return this.useCase.stream(params);
  }
}
