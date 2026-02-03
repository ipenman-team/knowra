export class AiConversationNotFoundError extends Error {
  constructor(conversationId: string) {
    super(`AI conversation not found: ${conversationId}`);
    this.name = 'AiConversationNotFoundError';
  }
}
