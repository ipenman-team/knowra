import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CancelBillingOrderUseCase,
  CreateBillingOrderUseCase,
  GetBillingBillUseCase,
  GetBillingOrderUseCase,
  GetTenantSubscriptionUseCase,
  ListBillingBillsUseCase,
  ListTenantEntitlementsUseCase,
} from '@knowra/application';
import { ListResponse, Response } from '@knowra/shared';
import { TenantId, UserId } from '../common/tenant/tenant-id.decorator';
import type { CreateBillingOrderDto } from './dto/create-billing-order.dto';
import type { ListBillingBillsQuery } from './dto/list-billing-bills.query';

function parseNumber(raw: string | undefined): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function mapUseCaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error ?? '');

  if (message === 'permission denied') {
    throw new UnauthorizedException('unauthorized');
  }
  if (message === 'order not found' || message === 'bill not found') {
    throw new NotFoundException(message);
  }

  if (
    message === 'paid order cannot be cancelled' ||
    message === 'order already closed' ||
    message === 'priceId is invalid' ||
    message === 'channel is invalid' ||
    message === 'returnUrl is invalid' ||
    message === 'returnUrl host is not allowed'
  ) {
    throw new BadRequestException(message);
  }

  if (message.endsWith('is required')) {
    throw new BadRequestException(message);
  }

  throw new BadRequestException(message || 'bad request');
}

@Controller('billing')
export class BillingController {
  constructor(
    private readonly createBillingOrderUseCase: CreateBillingOrderUseCase,
    private readonly getBillingOrderUseCase: GetBillingOrderUseCase,
    private readonly cancelBillingOrderUseCase: CancelBillingOrderUseCase,
    private readonly listBillingBillsUseCase: ListBillingBillsUseCase,
    private readonly getBillingBillUseCase: GetBillingBillUseCase,
    private readonly getTenantSubscriptionUseCase: GetTenantSubscriptionUseCase,
    private readonly listTenantEntitlementsUseCase: ListTenantEntitlementsUseCase,
  ) {}

  @Post('orders')
  async createOrder(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Body() body: CreateBillingOrderDto,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.createBillingOrderUseCase.create({
        tenantId,
        actorUserId: userId,
        priceId: String(body.priceId ?? ''),
        channel: String(body.channel ?? ''),
        clientType: body.clientType ?? null,
        returnUrl: body.returnUrl ?? null,
        idempotencyKey: body.idempotencyKey ?? null,
      });
      return new Response(data);
    } catch (error) {
      mapUseCaseError(error);
    }
  }

  @Get('orders/:orderId')
  async getOrder(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('orderId') orderId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.getBillingOrderUseCase.get({
        tenantId,
        actorUserId: userId,
        orderId,
      });
      return new Response(data);
    } catch (error) {
      mapUseCaseError(error);
    }
  }

  @Post('orders/:orderId/cancel')
  async cancelOrder(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('orderId') orderId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.cancelBillingOrderUseCase.cancel({
        tenantId,
        actorUserId: userId,
        orderId,
      });
      return new Response(data);
    } catch (error) {
      mapUseCaseError(error);
    }
  }

  @Get('bills')
  async listBills(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Query() query: ListBillingBillsQuery,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const result = await this.listBillingBillsUseCase.list({
        tenantId,
        actorUserId: userId,
        skip: parseNumber(query.skip),
        take: parseNumber(query.take),
      });

      return new ListResponse(result.items, undefined, { total: result.total });
    } catch (error) {
      mapUseCaseError(error);
    }
  }

  @Get('bills/:billId')
  async getBill(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
    @Param('billId') billId: string,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.getBillingBillUseCase.get({
        tenantId,
        actorUserId: userId,
        billId,
      });
      return new Response(data);
    } catch (error) {
      mapUseCaseError(error);
    }
  }

  @Get('subscription')
  async getSubscription(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.getTenantSubscriptionUseCase.get({
        tenantId,
        actorUserId: userId,
      });
      return new Response(data);
    } catch (error) {
      mapUseCaseError(error);
    }
  }

  @Get('entitlements')
  async listEntitlements(
    @TenantId() tenantId: string,
    @UserId() userId: string | undefined,
  ) {
    if (!userId) throw new UnauthorizedException('unauthorized');

    try {
      const data = await this.listTenantEntitlementsUseCase.list({
        tenantId,
        actorUserId: userId,
      });
      return new ListResponse(data);
    } catch (error) {
      mapUseCaseError(error);
    }
  }
}
