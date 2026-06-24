export type PaidProductType = 'visibility_boost' | 'area_expansion';
export type BillingModel = 'pay_as_you_go' | 'monthly_auto_renew';
export type PaymentStatus = 'pending' | 'requires_action' | 'matched' | 'failed' | 'rejected' | 'expired';
export type PaymentMethod = 'manual_cash' | 'manual_wallet' | 'manual_bank_transfer' | 'paymob_card';
export type PaymentProvider = 'paymob';
export type RenewalPolicy = 'none' | 'auto_charge_card';

export interface PaidProduct {
  id: string;
  version: number;
  type: PaidProductType;
  active: boolean;
  durationDays: number;
  priceAmount: number | null;
  currency: 'EGP';
  billingModel: BillingModel;
  capPolicy: 'none' | 'coverage_only';
  paymentProvider: PaymentProvider;
  renewalPolicy: RenewalPolicy;
  sortOrder: number;
}

export interface PaidProductSnapshot {
  productId: string;
  productVersion: number;
  productType: PaidProductType;
  durationDays: number;
  priceAmount: number | null;
  currency: 'EGP';
  billingModel: BillingModel;
  capPolicy: 'none' | 'coverage_only';
  paymentProvider: PaymentProvider;
  renewalPolicy: RenewalPolicy;
  snapshotAt: string;
}
