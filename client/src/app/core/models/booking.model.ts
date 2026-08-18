export interface CreateBookingRequest {
  packageId: string;

  customerName: string;

  customerPhone: string;

  bookingDate: string;

  timeSlot: string;

  quantity: number;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Booking {
  bookingId: string;

  packageId: string;

  packageName: string;

  pricingType: string;

  unitPrice: number;

  customerName: string;

  customerPhone: string;

  bookingDate: string;

  timeSlot: string;

  quantity: number;

  subtotal: number;

  discountAmount: number;

  totalAmount: number;

  bookingStatus: BookingStatus;

  paymentStatus: PaymentStatus;

  createdAt: string;

  updatedAt: string;
}

export interface PaymentLink {
  bookingId: string;

  amount: number;

  currency: string;

  paymentLinkId: string;

  paymentUrl: string;
}
