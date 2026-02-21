import type {
  BillingEntitlementSeed,
  BillingOrderLineItem,
} from '@knowra/domain';

export type BillingPricePlan = {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  periodDays: number;
  autoRenew: boolean;
  entitlements: BillingEntitlementSeed[];
};

const PRICE_PLANS: BillingPricePlan[] = [
  {
    id: 'PRO_MONTHLY',
    title: 'Knowra Pro 月付',
    description: '月付会员套餐',
    amount: 2990,
    currency: 'CNY',
    periodDays: 30,
    autoRenew: false,
    entitlements: [
      { key: 'membership.level', value: 'PRO' },
      { key: 'ai.tokens.monthly', value: 1200000 },
      { key: 'space.members.limit', value: 20 },
    ],
  },
  {
    id: 'PRO_YEARLY',
    title: 'Knowra Pro 年付',
    description: '年付会员套餐',
    amount: 29900,
    currency: 'CNY',
    periodDays: 365,
    autoRenew: false,
    entitlements: [
      { key: 'membership.level', value: 'PRO' },
      { key: 'ai.tokens.monthly', value: 1800000 },
      { key: 'space.members.limit', value: 50 },
    ],
  },
];

export function getBillingPricePlan(priceId: string): BillingPricePlan | null {
  return PRICE_PLANS.find((plan) => plan.id === priceId) ?? null;
}

export function buildLineItems(plan: BillingPricePlan): BillingOrderLineItem[] {
  return [
    {
      priceId: plan.id,
      title: plan.title,
      quantity: 1,
      unitAmount: plan.amount,
      totalAmount: plan.amount,
      periodDays: plan.periodDays,
      entitlements: plan.entitlements,
    },
  ];
}
