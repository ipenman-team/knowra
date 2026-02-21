export type CreateBillingOrderDto = {
  priceId?: string;
  channel?: string;
  clientType?: string;
  returnUrl?: string;
  idempotencyKey?: string;
};
