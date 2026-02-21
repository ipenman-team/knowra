import type {
  BillingChannel,
  BillingWebhookHandleResult,
  BillingRepository,
  PaymentGateway,
} from '@knowra/domain';

export class HandlePaymentWebhookUseCase {
  constructor(
    private readonly repo: BillingRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async handle(params: {
    channel: BillingChannel;
    body: unknown;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<BillingWebhookHandleResult> {
    const normalized = this.paymentGateway.normalizeWebhook({
      channel: params.channel,
      body: params.body,
      headers: params.headers,
    });

    return await this.repo.handleWebhook(normalized);
  }
}
