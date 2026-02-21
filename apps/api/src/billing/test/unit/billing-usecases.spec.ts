import {
  CreateBillingOrderUseCase,
  GetBillingOrderUseCase,
  HandlePaymentWebhookUseCase,
} from '../../../../../../packages/application/src/billing';
import type {
  BillingBill,
  BillingBillsResult,
  BillingOrder,
  BillingOrderDetail,
  BillingPayment,
  BillingRepository,
  BillingWebhookHandleResult,
  BillingWebhookInput,
  BillingWebhookStatus,
  CreatePaymentPayloadParams,
  CreateBillingOrderRecordParams,
  NormalizeWebhookParams,
  PaymentGateway,
  TenantEntitlement,
  TenantSubscription,
} from '../../../../../../packages/domain/src/billing';

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

class InMemoryBillingRepository implements BillingRepository {
  private orders: BillingOrder[] = [];
  private payments: BillingPayment[] = [];
  private bills: BillingBill[] = [];
  private subscriptions: TenantSubscription[] = [];
  private entitlements: TenantEntitlement[] = [];
  private eventKeys = new Set<string>();

  constructor(private readonly allowedUsers: Set<string>) {}

  async hasBillingPermission(params: {
    tenantId: string;
    userId: string;
  }): Promise<boolean> {
    return this.allowedUsers.has(`${params.tenantId}:${params.userId}`);
  }

  async findRecentOrderByIdempotencyKey(params: {
    tenantId: string;
    actorUserId: string;
    idempotencyKey: string;
  }): Promise<BillingOrderDetail | null> {
    const order =
      this.orders.find(
        (item) =>
          item.tenantId === params.tenantId &&
          item.buyerUserId === params.actorUserId &&
          (item.metadata as Record<string, unknown> | null)?.idempotencyKey ===
            params.idempotencyKey,
      ) ?? null;

    if (!order) return null;
    return this.buildOrderDetail(order.id);
  }

  async createOrderWithPayment(
    params: CreateBillingOrderRecordParams,
  ): Promise<BillingOrderDetail> {
    const now = new Date();
    const order: BillingOrder = {
      id: `o_${this.orders.length + 1}`,
      tenantId: params.tenantId,
      buyerUserId: params.buyerUserId,
      orderNo: params.orderNo,
      status: 'PAYING',
      channel: params.channel,
      clientType: params.clientType,
      currency: params.currency,
      amount: params.amount,
      subject: params.subject,
      description: params.description,
      lineItems: Array.isArray(params.lineItems)
        ? (params.lineItems as BillingOrder['lineItems'])
        : [],
      paidAt: null,
      expiredAt: params.expiredAt,
      metadata: {
        ...asObject(params.metadata),
        idempotencyKey: params.idempotencyKey,
      },
      createdBy: params.buyerUserId,
      updatedBy: params.buyerUserId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    const payment: BillingPayment = {
      id: `p_${this.payments.length + 1}`,
      tenantId: params.tenantId,
      orderId: order.id,
      channel: params.channel,
      clientType: params.clientType,
      status: 'INITIATED',
      outTradeNo: params.orderNo,
      providerTradeNo: null,
      requestPayload: params.channelRequestPayload,
      responsePayload: params.channelResponsePayload,
      paidAt: null,
      closedAt: null,
      createdBy: params.buyerUserId,
      updatedBy: params.buyerUserId,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    this.orders.push(order);
    this.payments.push(payment);

    return this.buildOrderDetail(order.id) as BillingOrderDetail;
  }

  async getOrderDetail(params: {
    tenantId: string;
    orderId: string;
  }): Promise<BillingOrderDetail | null> {
    const order = this.orders.find(
      (item) => item.id === params.orderId && item.tenantId === params.tenantId,
    );
    if (!order) return null;
    return this.buildOrderDetail(order.id);
  }

  async cancelOrder(params: {
    tenantId: string;
    orderId: string;
    actorUserId: string;
    cancelledAt: Date;
  }): Promise<BillingOrderDetail | null> {
    const order = this.orders.find(
      (item) => item.id === params.orderId && item.tenantId === params.tenantId,
    );
    if (!order) return null;
    order.status = 'CANCELLED';
    order.expiredAt = params.cancelledAt;
    order.updatedBy = params.actorUserId;
    order.updatedAt = params.cancelledAt;

    const payment = this.payments.find((item) => item.orderId === order.id);
    if (
      payment &&
      (payment.status === 'INITIATED' || payment.status === 'PENDING')
    ) {
      payment.status = 'CLOSED';
      payment.closedAt = params.cancelledAt;
      payment.updatedBy = params.actorUserId;
      payment.updatedAt = params.cancelledAt;
    }

    return this.buildOrderDetail(order.id);
  }

  async listBills(): Promise<BillingBillsResult> {
    return {
      items: [...this.bills],
      total: this.bills.length,
    };
  }

  async getBill(params: {
    tenantId: string;
    billId: string;
  }): Promise<BillingBill | null> {
    return (
      this.bills.find(
        (item) =>
          item.id === params.billId && item.tenantId === params.tenantId,
      ) ?? null
    );
  }

  async getSubscription(params: {
    tenantId: string;
  }): Promise<TenantSubscription | null> {
    return (
      this.subscriptions.find((item) => item.tenantId === params.tenantId) ??
      null
    );
  }

  async listActiveEntitlements(params: {
    tenantId: string;
    at: Date;
  }): Promise<TenantEntitlement[]> {
    return this.entitlements.filter(
      (item) =>
        item.tenantId === params.tenantId &&
        item.effectiveFrom <= params.at &&
        (!item.effectiveTo || item.effectiveTo > params.at),
    );
  }

  async handleWebhook(
    params: BillingWebhookInput,
  ): Promise<BillingWebhookHandleResult> {
    const key = `${params.channel}:${params.eventId}`;
    if (this.eventKeys.has(key)) {
      return { kind: 'IGNORED', reason: 'DUPLICATE_EVENT' };
    }
    this.eventKeys.add(key);

    if (params.verifyStatus === 'FAIL') {
      return { kind: 'IGNORED', reason: 'VERIFY_FAILED' };
    }

    if (!params.outTradeNo || !params.status) {
      return { kind: 'IGNORED', reason: 'INVALID_PAYLOAD' };
    }

    const payment = this.payments.find(
      (item) =>
        item.channel === params.channel &&
        item.outTradeNo === params.outTradeNo,
    );
    if (!payment) return { kind: 'IGNORED', reason: 'ORDER_NOT_FOUND' };

    const order = this.orders.find((item) => item.id === payment.orderId);
    if (!order) return { kind: 'IGNORED', reason: 'ORDER_NOT_FOUND' };

    if (
      params.amount === null ||
      params.currency === null ||
      params.amount !== order.amount ||
      params.currency !== order.currency
    ) {
      payment.status = 'FAILED';
      return { kind: 'IGNORED', reason: 'AMOUNT_MISMATCH' };
    }

    if (params.status !== 'SUCCESS') {
      return { kind: 'IGNORED', reason: 'STATUS_NOT_ACTIONABLE' };
    }

    if (order.status === 'PAID') {
      return { kind: 'IGNORED', reason: 'ALREADY_PAID' };
    }

    const paidAt = params.paidAt ?? new Date();
    payment.status = 'SUCCESS';
    payment.providerTradeNo = params.providerTradeNo;
    payment.paidAt = paidAt;

    order.status = 'PAID';
    order.paidAt = paidAt;

    const bill: BillingBill = {
      id: `b_${this.bills.length + 1}`,
      tenantId: order.tenantId,
      orderId: order.id,
      paymentId: payment.id,
      billNo: `BL_${this.bills.length + 1}`,
      status: 'ISSUED',
      currency: order.currency,
      amountPaid: order.amount,
      issuedAt: paidAt,
      lineItemsSnapshot: order.lineItems,
      buyerSnapshot: { buyerUserId: order.buyerUserId },
      metadata: null,
      createdBy: 'system',
      updatedBy: 'system',
      isDeleted: false,
      createdAt: paidAt,
      updatedAt: paidAt,
    };
    this.bills.push(bill);

    const periodEnd = new Date(paidAt.getTime());
    periodEnd.setDate(periodEnd.getDate() + 30);

    const subscription: TenantSubscription = {
      id: `s_${order.tenantId}`,
      tenantId: order.tenantId,
      status: 'ACTIVE',
      currentPeriodStartAt: paidAt,
      currentPeriodEndAt: periodEnd,
      autoRenew: false,
      sourceOrderId: order.id,
      planSnapshot: order.lineItems,
      createdBy: 'system',
      updatedBy: 'system',
      isDeleted: false,
      createdAt: paidAt,
      updatedAt: paidAt,
    };

    this.subscriptions = [
      ...this.subscriptions.filter((item) => item.tenantId !== order.tenantId),
      subscription,
    ];

    this.entitlements.push({
      id: `e_${this.entitlements.length + 1}`,
      tenantId: order.tenantId,
      key: 'membership.level',
      value: 'PRO',
      effectiveFrom: paidAt,
      effectiveTo: periodEnd,
      sourceType: 'ONE_TIME_PURCHASE',
      sourceRefId: order.id,
      reason: 'payment success',
      createdBy: 'system',
      updatedBy: 'system',
      isDeleted: false,
      createdAt: paidAt,
      updatedAt: paidAt,
    });

    return {
      kind: 'PROCESSED',
      orderId: order.id,
      tenantId: order.tenantId,
      billId: bill.id,
    };
  }

  private buildOrderDetail(orderId: string): BillingOrderDetail | null {
    const order = this.orders.find((item) => item.id === orderId) ?? null;
    if (!order) return null;

    const latestPayment =
      this.payments
        .filter((item) => item.orderId === orderId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
      null;

    return {
      order,
      latestPayment,
    };
  }
}

class TestPaymentGateway implements PaymentGateway {
  async createPaymentPayload(
    params: CreatePaymentPayloadParams,
  ): Promise<unknown> {
    return {
      mode: params.channel,
      outTradeNo: params.outTradeNo,
    };
  }

  normalizeWebhook(params: NormalizeWebhookParams): BillingWebhookInput {
    const body = asObject(params.body);
    const rawStatus = body.status;
    const status: BillingWebhookStatus | null =
      rawStatus === 'SUCCESS' ||
      rawStatus === 'CLOSED' ||
      rawStatus === 'FAILED'
        ? rawStatus
        : null;

    return {
      channel: params.channel,
      eventId: String(body.eventId ?? ''),
      outTradeNo: typeof body.outTradeNo === 'string' ? body.outTradeNo : null,
      providerTradeNo:
        typeof body.providerTradeNo === 'string' ? body.providerTradeNo : null,
      status,
      amount: typeof body.amount === 'number' ? body.amount : null,
      currency: typeof body.currency === 'string' ? body.currency : null,
      paidAt: null,
      verifyStatus: 'PASS',
      rawBody: JSON.stringify(params.body ?? {}),
      headers: {},
    };
  }
}

describe('Billing usecases', () => {
  test('CreateBillingOrderUseCase reuses order when idempotencyKey is duplicated', async () => {
    const repo = new InMemoryBillingRepository(new Set(['t1:u1']));
    const gateway = new TestPaymentGateway();
    const useCase = new CreateBillingOrderUseCase(repo, gateway);

    const first = await useCase.create({
      tenantId: 't1',
      actorUserId: 'u1',
      priceId: 'PRO_MONTHLY',
      channel: 'ALIPAY',
      idempotencyKey: 'ik-1',
    });

    const second = await useCase.create({
      tenantId: 't1',
      actorUserId: 'u1',
      priceId: 'PRO_MONTHLY',
      channel: 'ALIPAY',
      idempotencyKey: 'ik-1',
    });

    expect(first.orderId).toBe(second.orderId);
    expect(second.reused).toBe(true);
  });

  test('HandlePaymentWebhookUseCase processes success only once', async () => {
    const repo = new InMemoryBillingRepository(new Set(['t1:u1']));
    const gateway = new TestPaymentGateway();
    const create = new CreateBillingOrderUseCase(repo, gateway);
    const getOrder = new GetBillingOrderUseCase(repo);
    const webhook = new HandlePaymentWebhookUseCase(repo, gateway);

    const order = await create.create({
      tenantId: 't1',
      actorUserId: 'u1',
      priceId: 'PRO_MONTHLY',
      channel: 'WECHAT_PAY',
    });

    const first = await webhook.handle({
      channel: 'WECHAT_PAY',
      headers: {},
      body: {
        eventId: 'evt-1',
        outTradeNo: order.orderNo,
        providerTradeNo: 'pt-1',
        status: 'SUCCESS',
        amount: 2990,
        currency: 'CNY',
      },
    });

    const second = await webhook.handle({
      channel: 'WECHAT_PAY',
      headers: {},
      body: {
        eventId: 'evt-1',
        outTradeNo: order.orderNo,
        providerTradeNo: 'pt-1',
        status: 'SUCCESS',
        amount: 2990,
        currency: 'CNY',
      },
    });

    const detail = await getOrder.get({
      tenantId: 't1',
      actorUserId: 'u1',
      orderId: order.orderId,
    });

    expect(first).toMatchObject({ kind: 'PROCESSED' });
    expect(second).toEqual({ kind: 'IGNORED', reason: 'DUPLICATE_EVENT' });
    expect(detail.order.status).toBe('PAID');
  });

  test('HandlePaymentWebhookUseCase rejects mismatched amount', async () => {
    const repo = new InMemoryBillingRepository(new Set(['t1:u1']));
    const gateway = new TestPaymentGateway();
    const create = new CreateBillingOrderUseCase(repo, gateway);
    const getOrder = new GetBillingOrderUseCase(repo);
    const webhook = new HandlePaymentWebhookUseCase(repo, gateway);

    const order = await create.create({
      tenantId: 't1',
      actorUserId: 'u1',
      priceId: 'PRO_MONTHLY',
      channel: 'ALIPAY',
    });

    const result = await webhook.handle({
      channel: 'ALIPAY',
      headers: {},
      body: {
        eventId: 'evt-2',
        outTradeNo: order.orderNo,
        providerTradeNo: 'pt-2',
        status: 'SUCCESS',
        amount: 9999,
        currency: 'CNY',
      },
    });

    const detail = await getOrder.get({
      tenantId: 't1',
      actorUserId: 'u1',
      orderId: order.orderId,
    });

    expect(result).toEqual({ kind: 'IGNORED', reason: 'AMOUNT_MISMATCH' });
    expect(detail.order.status).toBe('PAYING');
  });
});
