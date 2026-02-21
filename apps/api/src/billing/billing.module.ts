import { Module } from '@nestjs/common';
import {
  CancelBillingOrderUseCase,
  CreateBillingOrderUseCase,
  GetBillingBillUseCase,
  GetBillingOrderUseCase,
  GetTenantSubscriptionUseCase,
  HandlePaymentWebhookUseCase,
  ListBillingBillsUseCase,
  ListTenantEntitlementsUseCase,
} from '@knowra/application';
import {
  MockPaymentGateway,
  PrismaBillingRepository,
} from '@knowra/infrastructure';
import { PrismaService } from '../prisma/prisma.service';
import { BillingController } from './billing.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { BILLING_PAYMENT_GATEWAY, BILLING_REPOSITORY } from './billing.tokens';

@Module({
  controllers: [BillingController, PaymentWebhookController],
  providers: [
    {
      provide: BILLING_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaBillingRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: BILLING_PAYMENT_GATEWAY,
      useFactory: () => new MockPaymentGateway(),
    },
    {
      provide: CreateBillingOrderUseCase,
      useFactory: (
        repo: PrismaBillingRepository,
        gateway: MockPaymentGateway,
      ) => new CreateBillingOrderUseCase(repo, gateway),
      inject: [BILLING_REPOSITORY, BILLING_PAYMENT_GATEWAY],
    },
    {
      provide: GetBillingOrderUseCase,
      useFactory: (repo: PrismaBillingRepository) =>
        new GetBillingOrderUseCase(repo),
      inject: [BILLING_REPOSITORY],
    },
    {
      provide: CancelBillingOrderUseCase,
      useFactory: (repo: PrismaBillingRepository) =>
        new CancelBillingOrderUseCase(repo),
      inject: [BILLING_REPOSITORY],
    },
    {
      provide: ListBillingBillsUseCase,
      useFactory: (repo: PrismaBillingRepository) =>
        new ListBillingBillsUseCase(repo),
      inject: [BILLING_REPOSITORY],
    },
    {
      provide: GetBillingBillUseCase,
      useFactory: (repo: PrismaBillingRepository) =>
        new GetBillingBillUseCase(repo),
      inject: [BILLING_REPOSITORY],
    },
    {
      provide: GetTenantSubscriptionUseCase,
      useFactory: (repo: PrismaBillingRepository) =>
        new GetTenantSubscriptionUseCase(repo),
      inject: [BILLING_REPOSITORY],
    },
    {
      provide: ListTenantEntitlementsUseCase,
      useFactory: (repo: PrismaBillingRepository) =>
        new ListTenantEntitlementsUseCase(repo),
      inject: [BILLING_REPOSITORY],
    },
    {
      provide: HandlePaymentWebhookUseCase,
      useFactory: (
        repo: PrismaBillingRepository,
        gateway: MockPaymentGateway,
      ) => new HandlePaymentWebhookUseCase(repo, gateway),
      inject: [BILLING_REPOSITORY, BILLING_PAYMENT_GATEWAY],
    },
  ],
})
export class BillingModule {}
