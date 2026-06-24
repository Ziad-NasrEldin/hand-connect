import type { PaidProduct } from '@/types/monetization';

export const paidProducts: PaidProduct[] = [
  {
    id: 'visibility_boost_30_paymob',
    version: 2,
    type: 'visibility_boost',
    active: true,
    durationDays: 30,
    priceAmount: 500,
    currency: 'EGP',
    billingModel: 'pay_as_you_go',
    capPolicy: 'none',
    paymentProvider: 'paymob',
    renewalPolicy: 'none',
    sortOrder: 10,
  },
  {
    id: 'area_expansion_30_paymob',
    version: 2,
    type: 'area_expansion',
    active: true,
    durationDays: 30,
    priceAmount: 250,
    currency: 'EGP',
    billingModel: 'monthly_auto_renew',
    capPolicy: 'coverage_only',
    paymentProvider: 'paymob',
    renewalPolicy: 'auto_charge_card',
    sortOrder: 20,
  },
];

export function productForVisibilityRequest(type: 'boost' | 'area_expansion') {
  const productType = type === 'boost' ? 'visibility_boost' : 'area_expansion';
  return paidProducts.find((product) => product.type === productType && product.active);
}
