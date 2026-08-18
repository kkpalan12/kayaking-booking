export interface CreateBookingRequest {
  packageId: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  timeSlot: string;
  quantity: number;
}

export interface Booking {
  bookingId: string;
  packageId: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  timeSlot: string;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
}

export interface PaymentLink {
  bookingId: string;
  amount: number;
  currency: string;
  paymentLinkId: string;
  paymentUrl: string;
}
