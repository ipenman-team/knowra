import type { BillingRepository, PaymentGateway } from '@knowra/domain';
import { buildLineItems, getBillingPricePlan } from './catalog';
import {
  buildExpiresAt,
  makeOrderNo,
  normalizeChannel,
  normalizeClientType,
  normalizeOptionalText,
  normalizeRequiredText,
  sanitizeReturnUrl,
} from './utils';

export type CreateBillingOrderResult = {
  orderId: string;
  orderNo: string;
  status: string;
  payableAmount: number;
  currency: string;
  clientType: string;
  channelPayload: unknown;
  reused: boolean;
};

export class CreateBillingOrderUseCase {
  constructor(
    private readonly repo: BillingRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async create(params: {
    tenantId: string;
    actorUserId: string;
    priceId: string;
    channel: string;
    clientType?: string | null;
    returnUrl?: string | null;
    idempotencyKey?: string | null;
  }): Promise<CreateBillingOrderResult> {
    const tenantId = normalizeRequiredText('tenantId', params.tenantId);
    const actorUserId = normalizeRequiredText(
      'actorUserId',
      params.actorUserId,
    );
    const priceId = normalizeRequiredText(
      'priceId',
      params.priceId,
    ).toUpperCase();
    const channel = normalizeChannel(params.channel);
    const clientType = normalizeClientType(params.clientType);
    const returnUrl = sanitizeReturnUrl(params.returnUrl);
    const idempotencyKey = normalizeOptionalText(params.idempotencyKey);

    const hasPermission = await this.repo.hasBillingPermission({
      tenantId,
      userId: actorUserId,
    });
    if (!hasPermission) throw new Error('permission denied');

    const plan = getBillingPricePlan(priceId);
    if (!plan) throw new Error('priceId is invalid');

    if (idempotencyKey) {
      const reused = await this.repo.findRecentOrderByIdempotencyKey({
        tenantId,
        actorUserId,
        idempotencyKey,
      });
      if (reused) {
        return {
          orderId: reused.order.id,
          orderNo: reused.order.orderNo,
          status: reused.order.status,
          payableAmount: reused.order.amount,
          currency: reused.order.currency,
          clientType: reused.order.clientType,
          channelPayload: reused.latestPayment?.responsePayload ?? null,
          reused: true,
        };
      }
    }

    const orderNo = makeOrderNo();
    const lineItems = buildLineItems(plan);
    const channelPayload = await this.paymentGateway.createPaymentPayload({
      channel,
      clientType,
      outTradeNo: orderNo,
      amount: plan.amount,
      currency: plan.currency,
      subject: plan.title,
      returnUrl,
    });

    const detail = await this.repo.createOrderWithPayment({
      tenantId,
      buyerUserId: actorUserId,
      orderNo,
      idempotencyKey,
      channel,
      clientType,
      currency: plan.currency,
      amount: plan.amount,
      subject: plan.title,
      description: plan.description,
      lineItems,
      channelRequestPayload: {
        priceId,
        channel,
        clientType,
        returnUrl,
      },
      channelResponsePayload: channelPayload,
      metadata: {
        priceId,
        autoRenew: plan.autoRenew,
      },
      expiredAt: buildExpiresAt(new Date()),
    });

    return {
      orderId: detail.order.id,
      orderNo: detail.order.orderNo,
      status: detail.order.status,
      payableAmount: detail.order.amount,
      currency: detail.order.currency,
      clientType: detail.order.clientType,
      channelPayload,
      reused: false,
    };
  }
}
