export type BillingChannel = 'ALIPAY' | 'WECHAT_PAY';

export type BillingClientType =
  | 'WEB_PC'
  | 'WEB_MOBILE_BROWSER'
  | 'WECHAT_IN_APP_BROWSER'
  | 'ALIPAY_IN_APP_BROWSER'
  | 'APP_WEBVIEW';

export type BillingOrderStatus =
  | 'CREATED'
  | 'PAYING'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED';

export type BillingPaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'CLOSED'
  | 'FAILED';

export type BillingBillStatus = 'ISSUED' | 'VOID' | 'REFUNDED';

export type TenantSubscriptionStatus =
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'EXPIRED';

export type EntitlementSourceType =
  | 'SUBSCRIPTION'
  | 'ONE_TIME_PURCHASE'
  | 'MANUAL';

export type BillingWebhookVerifyStatus = 'PASS' | 'FAIL';

export type BillingWebhookStatus = 'SUCCESS' | 'CLOSED' | 'FAILED';

export type BillingEntitlementSeed = {
  key: string;
  value: unknown;
};

export type BillingOrderLineItem = {
  priceId: string;
  title: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  periodDays?: number | null;
  entitlements?: BillingEntitlementSeed[] | null;
};

export type BillingOrder = {
  id: string;
  tenantId: string;
  buyerUserId: string;
  orderNo: string;
  status: BillingOrderStatus;
  channel: BillingChannel;
  clientType: BillingClientType;
  currency: string;
  amount: number;
  subject: string;
  description: string | null;
  lineItems: BillingOrderLineItem[];
  paidAt: Date | null;
  expiredAt: Date | null;
  metadata: unknown | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingPayment = {
  id: string;
  tenantId: string;
  orderId: string;
  channel: BillingChannel;
  clientType: BillingClientType;
  status: BillingPaymentStatus;
  outTradeNo: string;
  providerTradeNo: string | null;
  requestPayload: unknown | null;
  responsePayload: unknown | null;
  paidAt: Date | null;
  closedAt: Date | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingOrderDetail = {
  order: BillingOrder;
  latestPayment: BillingPayment | null;
};

export type BillingBill = {
  id: string;
  tenantId: string;
  orderId: string;
  paymentId: string;
  billNo: string;
  status: BillingBillStatus;
  currency: string;
  amountPaid: number;
  issuedAt: Date;
  lineItemsSnapshot: unknown;
  buyerSnapshot: unknown | null;
  metadata: unknown | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TenantSubscription = {
  id: string;
  tenantId: string;
  status: TenantSubscriptionStatus;
  currentPeriodStartAt: Date;
  currentPeriodEndAt: Date;
  autoRenew: boolean;
  sourceOrderId: string | null;
  planSnapshot: unknown;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TenantEntitlement = {
  id: string;
  tenantId: string;
  key: string;
  value: unknown;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  sourceType: EntitlementSourceType;
  sourceRefId: string;
  reason: string | null;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingWebhookEvent = {
  id: string;
  tenantId: string | null;
  channel: BillingChannel;
  eventId: string;
  outTradeNo: string | null;
  providerTradeNo: string | null;
  verifyStatus: BillingWebhookVerifyStatus;
  rawBody: string;
  headers: Record<string, unknown>;
  receivedAt: Date;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingWebhookInput = {
  channel: BillingChannel;
  eventId: string;
  outTradeNo: string | null;
  providerTradeNo: string | null;
  status: BillingWebhookStatus | null;
  amount: number | null;
  currency: string | null;
  paidAt: Date | null;
  verifyStatus: BillingWebhookVerifyStatus;
  rawBody: string;
  headers: Record<string, string>;
};

export type BillingWebhookHandleResult =
  | {
      kind: 'PROCESSED';
      orderId: string;
      tenantId: string;
      billId: string;
    }
  | {
      kind: 'IGNORED';
      reason:
        | 'VERIFY_FAILED'
        | 'DUPLICATE_EVENT'
        | 'ORDER_NOT_FOUND'
        | 'INVALID_PAYLOAD'
        | 'AMOUNT_MISMATCH'
        | 'ALREADY_PAID'
        | 'STATUS_NOT_ACTIONABLE';
    };

export type BillingBillsResult = {
  items: BillingBill[];
  total: number;
};
