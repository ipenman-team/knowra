import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  BillingBill,
  BillingBillsResult,
  BillingEntitlementSeed,
  BillingOrder,
  BillingOrderDetail,
  BillingOrderLineItem,
  BillingPayment,
  BillingRepository,
  BillingWebhookHandleResult,
  BillingWebhookInput,
  CreateBillingOrderRecordParams,
  TenantEntitlement,
  TenantSubscription,
} from '@knowra/domain';
import * as crypto from 'node:crypto';

const ORDER_DETAIL_INCLUDE = {
  payments: {
    where: { isDeleted: false },
    orderBy: [{ createdAt: 'desc' as const }],
    take: 1,
  },
} satisfies Prisma.BillingOrderInclude;

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseLineItems(raw: unknown): BillingOrderLineItem[] {
  if (!Array.isArray(raw)) return [];

  const output: BillingOrderLineItem[] = [];
  for (const item of raw) {
    const current = asObject(item);
    const priceId = typeof current.priceId === 'string' ? current.priceId : '';
    const title = typeof current.title === 'string' ? current.title : '';
    const quantity = Number(current.quantity ?? 0);
    const unitAmount = Number(current.unitAmount ?? 0);
    const totalAmount = Number(current.totalAmount ?? 0);
    const periodDays =
      current.periodDays === undefined || current.periodDays === null
        ? null
        : Number(current.periodDays);

    const entitlements = Array.isArray(current.entitlements)
      ? current.entitlements
          .map((entitlement) => {
            const record = asObject(entitlement);
            if (typeof record.key !== 'string' || !record.key.trim())
              return null;
            return {
              key: record.key,
              value: record.value,
            };
          })
          .filter((entitlement): entitlement is BillingEntitlementSeed =>
            Boolean(entitlement),
          )
      : null;

    if (!priceId || !title) continue;
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(unitAmount) || unitAmount < 0) continue;
    if (!Number.isFinite(totalAmount) || totalAmount < 0) continue;

    output.push({
      priceId,
      title,
      quantity: Math.floor(quantity),
      unitAmount: Math.floor(unitAmount),
      totalAmount: Math.floor(totalAmount),
      periodDays:
        periodDays === null || !Number.isFinite(periodDays)
          ? null
          : Math.max(Math.floor(periodDays), 0),
      entitlements,
    });
  }
  return output;
}

function normalizeHeaders(
  headers: Record<string, string>,
): Prisma.InputJsonObject {
  return headers as Prisma.InputJsonObject;
}

function asJsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function buildBillNo(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BL${stamp}${random}`;
}

function mapOrder(row: Prisma.BillingOrderGetPayload<{}>): BillingOrder {
  return {
    ...row,
    lineItems: parseLineItems(row.lineItems),
  };
}

function mapPayment(row: Prisma.BillingPaymentGetPayload<{}>): BillingPayment {
  return row;
}

function mapOrderDetail(
  row: Prisma.BillingOrderGetPayload<{ include: typeof ORDER_DETAIL_INCLUDE }>,
): BillingOrderDetail {
  return {
    order: mapOrder(row),
    latestPayment: row.payments[0] ? mapPayment(row.payments[0]) : null,
  };
}

function mapBill(row: Prisma.BillingBillGetPayload<{}>): BillingBill {
  return row;
}

function mapSubscription(
  row: Prisma.TenantSubscriptionGetPayload<{}>,
): TenantSubscription {
  return row;
}

function mapEntitlement(
  row: Prisma.TenantEntitlementGetPayload<{}>,
): TenantEntitlement {
  return row;
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function resolvePeriodDays(items: BillingOrderLineItem[]): number {
  for (const item of items) {
    if (item.periodDays && item.periodDays > 0) return item.periodDays;
  }
  return 30;
}

function buildPeriodEnd(startAt: Date, periodDays: number): Date {
  const end = new Date(startAt.getTime());
  end.setDate(end.getDate() + periodDays);
  return end;
}

function extractEntitlements(
  items: BillingOrderLineItem[],
): BillingEntitlementSeed[] {
  const output: BillingEntitlementSeed[] = [];
  for (const item of items) {
    if (!item.entitlements || item.entitlements.length === 0) continue;
    output.push(...item.entitlements);
  }
  return output;
}

function buildWebhookUpdatedPayload(
  current: unknown,
  params: {
    eventId: string;
    status: string | null;
    providerTradeNo: string | null;
  },
): Prisma.InputJsonValue {
  const payload = asObject(current);
  payload.lastWebhook = {
    eventId: params.eventId,
    status: params.status,
    providerTradeNo: params.providerTradeNo,
    receivedAt: new Date().toISOString(),
  };
  return payload as Prisma.InputJsonValue;
}

export class PrismaBillingRepository implements BillingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async hasBillingPermission(params: {
    tenantId: string;
    userId: string;
  }): Promise<boolean> {
    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        tenantId: params.tenantId,
        userId: params.userId,
        role: { in: ['OWNER', 'ADMIN'] },
        isDeleted: false,
      },
      select: { id: true },
    });

    return Boolean(membership);
  }

  async findRecentOrderByIdempotencyKey(params: {
    tenantId: string;
    actorUserId: string;
    idempotencyKey: string;
  }): Promise<BillingOrderDetail | null> {
    const since = new Date(Date.now() - 5 * 60 * 1000);
    const row = await this.prisma.billingOrder.findFirst({
      where: {
        tenantId: params.tenantId,
        buyerUserId: params.actorUserId,
        idempotencyKey: params.idempotencyKey,
        isDeleted: false,
        createdAt: { gte: since },
      },
      include: ORDER_DETAIL_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });

    if (!row) return null;
    return mapOrderDetail(row);
  }

  async createOrderWithPayment(
    params: CreateBillingOrderRecordParams,
  ): Promise<BillingOrderDetail> {
    return await this.prisma.$transaction(async (tx) => {
      const created = await tx.billingOrder.create({
        data: {
          tenantId: params.tenantId,
          buyerUserId: params.buyerUserId,
          orderNo: params.orderNo,
          idempotencyKey: params.idempotencyKey,
          status: 'PAYING',
          channel: params.channel,
          clientType: params.clientType,
          currency: params.currency,
          amount: params.amount,
          subject: params.subject,
          description: params.description,
          lineItems: asJsonInput(params.lineItems),
          metadata:
            params.metadata === null
              ? Prisma.JsonNull
              : asJsonInput(params.metadata),
          expiredAt: params.expiredAt,
          createdBy: params.buyerUserId,
          updatedBy: params.buyerUserId,
          payments: {
            create: {
              tenantId: params.tenantId,
              channel: params.channel,
              clientType: params.clientType,
              status: 'INITIATED',
              outTradeNo: params.orderNo,
              requestPayload: asJsonInput(params.channelRequestPayload),
              responsePayload: asJsonInput(params.channelResponsePayload),
              createdBy: params.buyerUserId,
              updatedBy: params.buyerUserId,
            },
          },
        },
        include: ORDER_DETAIL_INCLUDE,
      });

      return mapOrderDetail(created);
    });
  }

  async getOrderDetail(params: {
    tenantId: string;
    orderId: string;
  }): Promise<BillingOrderDetail | null> {
    const row = await this.prisma.billingOrder.findFirst({
      where: {
        id: params.orderId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
      include: ORDER_DETAIL_INCLUDE,
    });

    if (!row) return null;
    return mapOrderDetail(row);
  }

  async cancelOrder(params: {
    tenantId: string;
    orderId: string;
    actorUserId: string;
    cancelledAt: Date;
  }): Promise<BillingOrderDetail | null> {
    return await this.prisma.$transaction(async (tx) => {
      const row = await tx.billingOrder.findFirst({
        where: {
          id: params.orderId,
          tenantId: params.tenantId,
          isDeleted: false,
        },
        include: ORDER_DETAIL_INCLUDE,
      });

      if (!row) return null;

      await tx.billingOrder.update({
        where: { id: row.id },
        data: {
          status: 'CANCELLED',
          updatedBy: params.actorUserId,
          expiredAt: params.cancelledAt,
        },
      });

      await tx.billingPayment.updateMany({
        where: {
          orderId: row.id,
          tenantId: params.tenantId,
          isDeleted: false,
          status: { in: ['INITIATED', 'PENDING'] },
        },
        data: {
          status: 'CLOSED',
          closedAt: params.cancelledAt,
          updatedBy: params.actorUserId,
        },
      });

      const updated = await tx.billingOrder.findUnique({
        where: { id: row.id },
        include: ORDER_DETAIL_INCLUDE,
      });
      if (!updated) return null;

      return mapOrderDetail(updated);
    });
  }

  async listBills(params: {
    tenantId: string;
    skip: number;
    take: number;
  }): Promise<BillingBillsResult> {
    const where: Prisma.BillingBillWhereInput = {
      tenantId: params.tenantId,
      isDeleted: false,
    };

    const [items, total] = await Promise.all([
      this.prisma.billingBill.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.billingBill.count({ where }),
    ]);

    return {
      items: items.map((item) => mapBill(item)),
      total,
    };
  }

  async getBill(params: {
    tenantId: string;
    billId: string;
  }): Promise<BillingBill | null> {
    const row = await this.prisma.billingBill.findFirst({
      where: {
        id: params.billId,
        tenantId: params.tenantId,
        isDeleted: false,
      },
    });

    if (!row) return null;
    return mapBill(row);
  }

  async getSubscription(params: {
    tenantId: string;
  }): Promise<TenantSubscription | null> {
    const row = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenantId: params.tenantId,
        isDeleted: false,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    if (!row) return null;
    return mapSubscription(row);
  }

  async listActiveEntitlements(params: {
    tenantId: string;
    at: Date;
  }): Promise<TenantEntitlement[]> {
    const rows = await this.prisma.tenantEntitlement.findMany({
      where: {
        tenantId: params.tenantId,
        isDeleted: false,
        effectiveFrom: { lte: params.at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: params.at } }],
      },
      orderBy: [{ key: 'asc' }, { effectiveFrom: 'desc' }],
    });

    return rows.map((row) => mapEntitlement(row));
  }

  async handleWebhook(
    params: BillingWebhookInput,
  ): Promise<BillingWebhookHandleResult> {
    return await this.prisma.$transaction(async (tx) => {
      let createdEvent: Prisma.BillingWebhookEventGetPayload<{}>;
      try {
        createdEvent = await tx.billingWebhookEvent.create({
          data: {
            tenantId: null,
            channel: params.channel,
            eventId: params.eventId,
            outTradeNo: params.outTradeNo,
            providerTradeNo: params.providerTradeNo,
            verifyStatus: params.verifyStatus,
            rawBody: params.rawBody,
            headers: normalizeHeaders(params.headers),
            receivedAt: new Date(),
            createdBy: 'system',
            updatedBy: 'system',
          },
        });
      } catch (error) {
        if (isUniqueConflict(error)) {
          return { kind: 'IGNORED', reason: 'DUPLICATE_EVENT' };
        }
        throw error;
      }

      if (params.verifyStatus === 'FAIL') {
        return { kind: 'IGNORED', reason: 'VERIFY_FAILED' };
      }

      if (!params.outTradeNo || !params.status) {
        return { kind: 'IGNORED', reason: 'INVALID_PAYLOAD' };
      }

      const payment = await tx.billingPayment.findFirst({
        where: {
          channel: params.channel,
          outTradeNo: params.outTradeNo,
          isDeleted: false,
        },
        include: {
          order: true,
        },
      });

      if (!payment || payment.order.isDeleted) {
        return { kind: 'IGNORED', reason: 'ORDER_NOT_FOUND' };
      }

      await tx.billingWebhookEvent.update({
        where: { id: createdEvent.id },
        data: {
          tenantId: payment.tenantId,
          updatedBy: 'system',
        },
      });

      const order = payment.order;
      const expectedCurrency = order.currency.toUpperCase();
      const receivedCurrency = (params.currency ?? '').toUpperCase();
      if (
        params.amount === null ||
        order.amount !== params.amount ||
        receivedCurrency !== expectedCurrency
      ) {
        await tx.billingPayment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            responsePayload: buildWebhookUpdatedPayload(
              payment.responsePayload,
              {
                eventId: params.eventId,
                status: params.status,
                providerTradeNo: params.providerTradeNo,
              },
            ),
            updatedBy: 'system',
          },
        });
        return { kind: 'IGNORED', reason: 'AMOUNT_MISMATCH' };
      }

      if (params.status === 'SUCCESS') {
        if (order.status === 'PAID') {
          return { kind: 'IGNORED', reason: 'ALREADY_PAID' };
        }

        const paidAt = params.paidAt ?? new Date();
        await tx.billingPayment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            providerTradeNo: params.providerTradeNo ?? payment.providerTradeNo,
            paidAt,
            responsePayload: buildWebhookUpdatedPayload(
              payment.responsePayload,
              {
                eventId: params.eventId,
                status: params.status,
                providerTradeNo: params.providerTradeNo,
              },
            ),
            updatedBy: 'system',
          },
        });

        await tx.billingOrder.update({
          where: { id: order.id },
          data: {
            status: 'PAID',
            paidAt,
            updatedBy: 'system',
          },
        });

        let bill = await tx.billingBill.findFirst({
          where: {
            orderId: order.id,
            tenantId: order.tenantId,
            isDeleted: false,
          },
        });

        if (!bill) {
          bill = await tx.billingBill.create({
            data: {
              tenantId: order.tenantId,
              orderId: order.id,
              paymentId: payment.id,
              billNo: buildBillNo(),
              status: 'ISSUED',
              currency: order.currency,
              amountPaid: order.amount,
              issuedAt: paidAt,
              lineItemsSnapshot: asJsonInput(order.lineItems),
              buyerSnapshot: {
                buyerUserId: order.buyerUserId,
              },
              metadata: {
                source: 'webhook',
                channel: params.channel,
              },
              createdBy: 'system',
              updatedBy: 'system',
            },
          });
        }

        const parsedLineItems = parseLineItems(order.lineItems);
        const periodDays = resolvePeriodDays(parsedLineItems);
        const periodEnd = buildPeriodEnd(paidAt, periodDays);
        const planSnapshot = asJsonInput({
          sourceOrderId: order.id,
          lineItems: parsedLineItems,
        });

        await tx.tenantSubscription.upsert({
          where: { tenantId: order.tenantId },
          update: {
            status: 'ACTIVE',
            currentPeriodStartAt: paidAt,
            currentPeriodEndAt: periodEnd,
            autoRenew: false,
            sourceOrderId: order.id,
            planSnapshot,
            updatedBy: 'system',
          },
          create: {
            tenantId: order.tenantId,
            status: 'ACTIVE',
            currentPeriodStartAt: paidAt,
            currentPeriodEndAt: periodEnd,
            autoRenew: false,
            sourceOrderId: order.id,
            planSnapshot,
            createdBy: 'system',
            updatedBy: 'system',
          },
        });

        await tx.tenantEntitlement.updateMany({
          where: {
            tenantId: order.tenantId,
            sourceRefId: order.id,
            sourceType: 'ONE_TIME_PURCHASE',
            isDeleted: false,
          },
          data: {
            isDeleted: true,
            updatedBy: 'system',
          },
        });

        const entitlements = extractEntitlements(parsedLineItems);
        if (entitlements.length > 0) {
          await tx.tenantEntitlement.createMany({
            data: entitlements.map((item) => ({
              tenantId: order.tenantId,
              key: item.key,
              value: asJsonInput(item.value),
              effectiveFrom: paidAt,
              effectiveTo: periodEnd,
              sourceType: 'ONE_TIME_PURCHASE',
              sourceRefId: order.id,
              reason: 'billing payment success',
              createdBy: 'system',
              updatedBy: 'system',
            })),
          });
        }

        return {
          kind: 'PROCESSED',
          orderId: order.id,
          tenantId: order.tenantId,
          billId: bill.id,
        };
      }

      if (order.status === 'PAID') {
        return { kind: 'IGNORED', reason: 'ALREADY_PAID' };
      }

      if (params.status === 'CLOSED' || params.status === 'FAILED') {
        await tx.billingPayment.update({
          where: { id: payment.id },
          data: {
            status: params.status === 'CLOSED' ? 'CLOSED' : 'FAILED',
            providerTradeNo: params.providerTradeNo ?? payment.providerTradeNo,
            closedAt: new Date(),
            responsePayload: buildWebhookUpdatedPayload(
              payment.responsePayload,
              {
                eventId: params.eventId,
                status: params.status,
                providerTradeNo: params.providerTradeNo,
              },
            ),
            updatedBy: 'system',
          },
        });

        if (params.status === 'CLOSED') {
          await tx.billingOrder.update({
            where: { id: order.id },
            data: {
              status: 'CANCELLED',
              updatedBy: 'system',
            },
          });
        }

        return { kind: 'IGNORED', reason: 'STATUS_NOT_ACTIONABLE' };
      }

      return { kind: 'IGNORED', reason: 'INVALID_PAYLOAD' };
    });
  }
}
