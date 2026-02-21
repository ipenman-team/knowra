-- CreateEnum
CREATE TYPE "BillingChannel" AS ENUM ('ALIPAY', 'WECHAT_PAY');

-- CreateEnum
CREATE TYPE "BillingClientType" AS ENUM ('WEB_PC', 'WEB_MOBILE_BROWSER', 'WECHAT_IN_APP_BROWSER', 'ALIPAY_IN_APP_BROWSER', 'APP_WEBVIEW');

-- CreateEnum
CREATE TYPE "BillingOrderStatus" AS ENUM ('CREATED', 'PAYING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BillingPaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'CLOSED', 'FAILED');

-- CreateEnum
CREATE TYPE "BillingBillStatus" AS ENUM ('ISSUED', 'VOID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BillingWebhookVerifyStatus" AS ENUM ('PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "TenantSubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EntitlementSourceType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME_PURCHASE', 'MANUAL');

-- CreateTable
CREATE TABLE "billing_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "buyer_user_id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "status" "BillingOrderStatus" NOT NULL DEFAULT 'CREATED',
    "channel" "BillingChannel" NOT NULL,
    "client_type" "BillingClientType" NOT NULL DEFAULT 'WEB_PC',
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "amount" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "line_items" JSONB NOT NULL,
    "metadata" JSONB,
    "paid_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "channel" "BillingChannel" NOT NULL,
    "client_type" "BillingClientType" NOT NULL DEFAULT 'WEB_PC',
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "out_trade_no" TEXT NOT NULL,
    "provider_trade_no" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "paid_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_webhook_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "channel" "BillingChannel" NOT NULL,
    "event_id" TEXT NOT NULL,
    "out_trade_no" TEXT,
    "provider_trade_no" TEXT,
    "verify_status" "BillingWebhookVerifyStatus" NOT NULL,
    "raw_body" TEXT NOT NULL,
    "headers" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_bills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "bill_no" TEXT NOT NULL,
    "status" "BillingBillStatus" NOT NULL DEFAULT 'ISSUED',
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "amount_paid" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "line_items_snapshot" JSONB NOT NULL,
    "buyer_snapshot" JSONB,
    "metadata" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status" "TenantSubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_period_start_at" TIMESTAMP(3) NOT NULL,
    "current_period_end_at" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "source_order_id" TEXT,
    "plan_snapshot" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_entitlements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "source_type" "EntitlementSourceType" NOT NULL,
    "source_ref_id" TEXT NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_orders_order_no_key" ON "billing_orders"("order_no");

-- CreateIndex
CREATE INDEX "billing_orders_tenant_buyer_idx" ON "billing_orders"("tenant_id", "buyer_user_id");

-- CreateIndex
CREATE INDEX "billing_orders_tenant_status_created_idx" ON "billing_orders"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "billing_orders_tenant_idempotency_idx" ON "billing_orders"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "billing_payments_tenant_order_idx" ON "billing_payments"("tenant_id", "order_id");

-- CreateIndex
CREATE INDEX "billing_payments_tenant_status_created_idx" ON "billing_payments"("tenant_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payments_channel_out_trade_no_key" ON "billing_payments"("channel", "out_trade_no");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payments_channel_provider_trade_no_key" ON "billing_payments"("channel", "provider_trade_no");

-- CreateIndex
CREATE UNIQUE INDEX "billing_webhooks_channel_event_id_key" ON "billing_webhook_events"("channel", "event_id");

-- CreateIndex
CREATE INDEX "billing_webhooks_tenant_received_idx" ON "billing_webhook_events"("tenant_id", "received_at");

-- CreateIndex
CREATE INDEX "billing_webhooks_channel_out_trade_idx" ON "billing_webhook_events"("channel", "out_trade_no");

-- CreateIndex
CREATE INDEX "billing_webhooks_channel_provider_trade_idx" ON "billing_webhook_events"("channel", "provider_trade_no");

-- CreateIndex
CREATE UNIQUE INDEX "billing_bills_order_id_key" ON "billing_bills"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_bills_payment_id_key" ON "billing_bills"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_bills_bill_no_key" ON "billing_bills"("bill_no");

-- CreateIndex
CREATE INDEX "billing_bills_tenant_issued_idx" ON "billing_bills"("tenant_id", "issued_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subscriptions_tenant_id_key" ON "tenant_subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenant_status_end_idx" ON "tenant_subscriptions"("tenant_id", "status", "current_period_end_at");

-- CreateIndex
CREATE INDEX "tenant_entitlements_tenant_key_effective_idx" ON "tenant_entitlements"("tenant_id", "key", "effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "tenant_entitlements_tenant_source_idx" ON "tenant_entitlements"("tenant_id", "source_type", "source_ref_id");

-- AddForeignKey
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "billing_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_bills" ADD CONSTRAINT "billing_bills_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "billing_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_bills" ADD CONSTRAINT "billing_bills_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "billing_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_source_order_id_fkey" FOREIGN KEY ("source_order_id") REFERENCES "billing_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
