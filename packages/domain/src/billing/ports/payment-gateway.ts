import type {
  BillingChannel,
  BillingClientType,
  BillingWebhookInput,
} from '../types';

export type CreatePaymentPayloadParams = {
  channel: BillingChannel;
  clientType: BillingClientType;
  outTradeNo: string;
  amount: number;
  currency: string;
  subject: string;
  returnUrl: string | null;
};

export type NormalizeWebhookParams = {
  channel: BillingChannel;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export interface PaymentGateway {
  createPaymentPayload(params: CreatePaymentPayloadParams): Promise<unknown>;
  normalizeWebhook(params: NormalizeWebhookParams): BillingWebhookInput;
}
