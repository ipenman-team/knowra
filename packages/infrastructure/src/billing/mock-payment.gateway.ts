import type {
  BillingChannel,
  BillingWebhookStatus,
  BillingWebhookVerifyStatus,
  CreatePaymentPayloadParams,
  NormalizeWebhookParams,
  PaymentGateway,
} from '@knowra/domain';
import * as crypto from 'node:crypto';

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stringifyBody(body: unknown): string {
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body ?? {});
  } catch {
    return '{}';
  }
}

function normalizeHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      output[key.toLowerCase()] = value.join(',');
      continue;
    }
    if (typeof value === 'string') {
      output[key.toLowerCase()] = value;
    }
  }
  return output;
}

function pickText(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (value) return value;
  }
  return null;
}

function pickAmount(record: Record<string, unknown>): number | null {
  const candidates = [
    record.amount,
    record.totalAmount,
    record.total_fee,
    record.totalFee,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.floor(candidate);
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      const numeric = Number(candidate.trim());
      if (Number.isFinite(numeric)) return Math.floor(numeric);
    }
  }
  return null;
}

function pickStatus(
  record: Record<string, unknown>,
): BillingWebhookStatus | null {
  const raw = pickText(record, [
    'status',
    'tradeStatus',
    'trade_status',
    'tradeState',
  ]);
  if (!raw) return null;

  const value = raw.toUpperCase();
  if (['SUCCESS', 'TRADE_SUCCESS', 'PAY_SUCCESS', 'PAID'].includes(value)) {
    return 'SUCCESS';
  }
  if (['CLOSED', 'TRADE_CLOSED', 'REVOKED', 'CANCELLED'].includes(value)) {
    return 'CLOSED';
  }
  if (['FAILED', 'FAIL', 'TRADE_FAIL'].includes(value)) {
    return 'FAILED';
  }
  return null;
}

function pickPaidAt(record: Record<string, unknown>): Date | null {
  const raw = pickText(record, [
    'paidAt',
    'successTime',
    'time_end',
    'gmt_payment',
  ]);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toSigningBase(input: {
  eventId: string;
  outTradeNo: string | null;
  status: BillingWebhookStatus | null;
  amount: number | null;
  currency: string | null;
}): string {
  return [
    input.eventId,
    input.outTradeNo ?? '',
    input.status ?? '',
    input.amount === null ? '' : String(input.amount),
    input.currency ?? '',
  ].join('|');
}

function channelSecret(channel: BillingChannel): string {
  if (channel === 'ALIPAY') {
    return (
      process.env.BILLING_ALIPAY_WEBHOOK_SECRET ?? 'billing-alipay-dev-secret'
    );
  }
  return (
    process.env.BILLING_WECHAT_WEBHOOK_SECRET ?? 'billing-wechat-dev-secret'
  );
}

function verifySignature(params: {
  channel: BillingChannel;
  signature: string | null;
  signingBase: string;
}): BillingWebhookVerifyStatus {
  if (
    (process.env.BILLING_SKIP_SIGNATURE_VERIFY ?? '').toLowerCase() === 'true'
  ) {
    return 'PASS';
  }

  const signature = params.signature?.trim().toLowerCase();
  if (!signature) return 'FAIL';

  const expected = crypto
    .createHmac('sha256', channelSecret(params.channel))
    .update(params.signingBase)
    .digest('hex')
    .toLowerCase();

  if (signature.length !== expected.length) return 'FAIL';
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      ? 'PASS'
      : 'FAIL';
  } catch {
    return 'FAIL';
  }
}

function buildAlipayPayload(params: CreatePaymentPayloadParams): unknown {
  const mode = params.clientType === 'WEB_PC' ? 'ALIPAY_PAGE' : 'ALIPAY_WAP';
  const payUrl =
    mode === 'ALIPAY_PAGE'
      ? `https://openapi.alipay.mock/page-pay?outTradeNo=${encodeURIComponent(params.outTradeNo)}`
      : `https://openapi.alipay.mock/wap-pay?outTradeNo=${encodeURIComponent(params.outTradeNo)}`;

  return {
    mode,
    payUrl,
    outTradeNo: params.outTradeNo,
    amount: params.amount,
    currency: params.currency,
    returnUrl: params.returnUrl,
  };
}

function buildWechatPayload(params: CreatePaymentPayloadParams): unknown {
  if (params.clientType === 'WECHAT_IN_APP_BROWSER') {
    return {
      mode: 'WECHAT_JSAPI',
      jsapiParams: {
        appId: process.env.BILLING_WECHAT_APP_ID ?? 'wx_mock_appid',
        timeStamp: String(Math.floor(Date.now() / 1000)),
        nonceStr: crypto.randomBytes(8).toString('hex'),
        package: `prepay_id=mock_${params.outTradeNo}`,
        signType: 'HMAC-SHA256',
        paySign: crypto.randomBytes(16).toString('hex'),
      },
      returnUrl: params.returnUrl,
    };
  }

  if (
    params.clientType === 'WEB_MOBILE_BROWSER' ||
    params.clientType === 'APP_WEBVIEW'
  ) {
    return {
      mode: 'WECHAT_H5',
      h5Url: `https://wx.tenpay.mock/mweb/pay?outTradeNo=${encodeURIComponent(params.outTradeNo)}`,
      returnUrl: params.returnUrl,
    };
  }

  return {
    mode: 'WECHAT_NATIVE',
    codeUrl: `weixin://wxpay/bizpayurl?pr=${encodeURIComponent(params.outTradeNo)}`,
    returnUrl: params.returnUrl,
  };
}

export class MockPaymentGateway implements PaymentGateway {
  async createPaymentPayload(
    params: CreatePaymentPayloadParams,
  ): Promise<unknown> {
    if (params.channel === 'ALIPAY') return buildAlipayPayload(params);
    return buildWechatPayload(params);
  }

  normalizeWebhook(params: NormalizeWebhookParams) {
    const headers = normalizeHeaders(params.headers);
    const bodyRecord = asObject(params.body);
    const rawBody = stringifyBody(params.body);

    const eventId =
      pickText(bodyRecord, ['eventId', 'notify_id', 'notificationId', 'id']) ??
      crypto.createHash('sha256').update(rawBody).digest('hex');

    const outTradeNo = pickText(bodyRecord, ['outTradeNo', 'out_trade_no']);
    const providerTradeNo = pickText(bodyRecord, [
      'providerTradeNo',
      'trade_no',
      'transactionId',
      'transaction_id',
    ]);
    const status = pickStatus(bodyRecord);
    const amount = pickAmount(bodyRecord);
    const currency =
      pickText(bodyRecord, ['currency', 'fee_type'])?.toUpperCase() ?? 'CNY';
    const paidAt = pickPaidAt(bodyRecord);

    const signature =
      pickText(bodyRecord, ['signature', 'sign']) ??
      headers['x-billing-signature'] ??
      headers['x-signature'] ??
      null;

    const signingBase = toSigningBase({
      eventId,
      outTradeNo,
      status,
      amount,
      currency,
    });

    const verifyStatus = verifySignature({
      channel: params.channel,
      signature,
      signingBase,
    });

    return {
      channel: params.channel,
      eventId,
      outTradeNo,
      providerTradeNo,
      status,
      amount,
      currency,
      paidAt,
      verifyStatus,
      rawBody,
      headers,
    };
  }
}
