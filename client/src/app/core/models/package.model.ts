export type PricingType = 'PER_PERSON' | 'PER_BOOKING';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface PackageDiscount {
  enabled: boolean;
  type: DiscountType;
  value: number;
}

export interface KayakingPackage {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  pricingType: PricingType;
  discount: PackageDiscount;
  duration?: string;
  image?: string;
  isActive: boolean;
}
