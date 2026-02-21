import { Body, Controller, Post, Req } from '@nestjs/common';
import { HandlePaymentWebhookUseCase } from '@knowra/application';
import type { Request } from 'express';
import type { PaymentWebhookDto } from './dto/payment-webhook.dto';

function toHeaderRecord(
  headers: Request['headers'],
): Record<string, string | string[] | undefined> {
  const output: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!value) continue;
    output[key] = value;
  }
  return output;
}

function successAck(channel: 'ALIPAY' | 'WECHAT_PAY') {
  if (channel === 'ALIPAY') return 'success';
  return { code: 'SUCCESS', message: 'OK' };
}

function failAck(channel: 'ALIPAY' | 'WECHAT_PAY') {
  if (channel === 'ALIPAY') return 'fail';
  return { code: 'FAIL', message: 'FAILED' };
}

@Controller('webhooks/payments')
export class PaymentWebhookController {
  constructor(
    private readonly handlePaymentWebhookUseCase: HandlePaymentWebhookUseCase,
  ) {}

  @Post('alipay')
  async handleAlipay(@Body() body: PaymentWebhookDto, @Req() req: Request) {
    try {
      await this.handlePaymentWebhookUseCase.handle({
        channel: 'ALIPAY',
        body,
        headers: toHeaderRecord(req.headers),
      });
      return successAck('ALIPAY');
    } catch {
      return failAck('ALIPAY');
    }
  }

  @Post('wechat')
  async handleWechat(@Body() body: PaymentWebhookDto, @Req() req: Request) {
    try {
      await this.handlePaymentWebhookUseCase.handle({
        channel: 'WECHAT_PAY',
        body,
        headers: toHeaderRecord(req.headers),
      });
      return successAck('WECHAT_PAY');
    } catch {
      return failAck('WECHAT_PAY');
    }
  }
}
