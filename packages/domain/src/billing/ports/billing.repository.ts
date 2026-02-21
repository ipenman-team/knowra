import type {
  BillingBill,
  BillingBillsResult,
  BillingChannel,
  BillingClientType,
  BillingOrderDetail,
  BillingWebhookHandleResult,
  BillingWebhookInput,
  TenantEntitlement,
  TenantSubscription,
} from '../types';

export type CreateBillingOrderRecordParams = {
  tenantId: string;
  buyerUserId: string;
  orderNo: string;
  idempotencyKey: string | null;
  channel: BillingChannel;
  clientType: BillingClientType;
  currency: string;
  amount: number;
  subject: string;
  description: string | null;
  lineItems: unknown;
  channelRequestPayload: unknown;
  channelResponsePayload: unknown;
  metadata: unknown | null;
  expiredAt: Date | null;
};

export interface BillingRepository {
  hasBillingPermission(params: {
    tenantId: string;
    userId: string;
  }): Promise<boolean>;

  findRecentOrderByIdempotencyKey(params: {
    tenantId: string;
    actorUserId: string;
    idempotencyKey: string;
  }): Promise<BillingOrderDetail | null>;

  createOrderWithPayment(
    params: CreateBillingOrderRecordParams,
  ): Promise<BillingOrderDetail>;

  getOrderDetail(params: {
    tenantId: string;
    orderId: string;
  }): Promise<BillingOrderDetail | null>;

  cancelOrder(params: {
    tenantId: string;
    orderId: string;
    actorUserId: string;
    cancelledAt: Date;
  }): Promise<BillingOrderDetail | null>;

  listBills(params: {
    tenantId: string;
    skip: number;
    take: number;
  }): Promise<BillingBillsResult>;

  getBill(params: {
    tenantId: string;
    billId: string;
  }): Promise<BillingBill | null>;

  getSubscription(params: {
    tenantId: string;
  }): Promise<TenantSubscription | null>;

  listActiveEntitlements(params: {
    tenantId: string;
    at: Date;
  }): Promise<TenantEntitlement[]>;

  handleWebhook(
    params: BillingWebhookInput,
  ): Promise<BillingWebhookHandleResult>;
}
