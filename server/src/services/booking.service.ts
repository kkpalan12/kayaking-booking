import { PackageModel } from "../models/package.model";
import { BookingModel } from "../models/booking.model";

interface CreateBookingInput {
  packageId: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  timeSlot: string;
  quantity: number;
}

export type UpdateBookingStatus = "PENDING" | "CANCELLED";

/**
 * Generate a unique customer-facing booking ID.
 *
 * Example:
 * KAY-20260818-4821
 */
function generateBookingId(): string {
  const date = new Date();

  const datePart =
    `${date.getFullYear()}` +
    `${String(date.getMonth() + 1).padStart(2, "0")}` +
    `${String(date.getDate()).padStart(2, "0")}`;

  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `KAY-${datePart}-${randomPart}`;
}

/**
 * Calculate booking price.
 */
export async function calculateBookingPrice(
  packageId: string,
  quantity: number,
) {
  const packageData = await PackageModel.findOne({
    _id: packageId,
    isActive: true,
  });

  if (!packageData) {
    throw new Error("Package not found or inactive");
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  /**
   * PER_BOOKING:
   * price is charged once regardless of quantity.
   *
   * PER_PERSON:
   * price is multiplied by quantity.
   */
  const billableQuantity =
    packageData.pricingType === "PER_BOOKING" ? 1 : quantity;

  const subtotal = packageData.price * billableQuantity;

  let discountAmount = 0;

  if (packageData.discount?.enabled && packageData.discount.value > 0) {
    if (packageData.discount.type === "PERCENTAGE") {
      discountAmount = subtotal * (packageData.discount.value / 100);
    } else {
      discountAmount = packageData.discount.value;
    }
  }

  /**
   * Discount can never exceed subtotal.
   */
  discountAmount = Math.min(discountAmount, subtotal);

  const totalAmount = subtotal - discountAmount;

  return {
    packageData,
    quantity,
    subtotal,
    discountAmount,
    totalAmount,
  };
}

/**
 * Create a new booking.
 *
 * New bookings always start as:
 *
 * bookingStatus = PENDING
 * paymentStatus = PENDING
 *
 * Razorpay webhook will automatically change
 * both statuses after successful payment.
 */
export async function createBooking(input: CreateBookingInput) {
  const pricing = await calculateBookingPrice(input.packageId, input.quantity);

  const booking = await BookingModel.create({
    bookingId: generateBookingId(),

    packageId: pricing.packageData._id,

    packageName: pricing.packageData.name,

    pricingType: pricing.packageData.pricingType,

    unitPrice: pricing.packageData.price,

    customerName: input.customerName.trim(),

    customerPhone: input.customerPhone.trim(),

    bookingDate: new Date(input.bookingDate),

    timeSlot: input.timeSlot,

    quantity: input.quantity,

    subtotal: pricing.subtotal,

    discountAmount: pricing.discountAmount,

    totalAmount: pricing.totalAmount,

    bookingStatus: "PENDING",

    paymentStatus: "PENDING",
  });

  return booking;
}

/**
 * Get a single booking by customer-facing booking ID.
 */
export async function getBookingById(bookingId: string) {
  return BookingModel.findOne({
    bookingId,
  });
}

/**
 * Get all bookings.
 *
 * Newest bookings first.
 */
export async function getBookings() {
  return BookingModel.find().sort({
    createdAt: -1,
  });
}

/**
 * Update booking status from admin.
 *
 * IMPORTANT:
 * CONFIRMED is intentionally NOT accepted here.
 *
 * Successful Razorpay payment automatically
 * changes the booking to CONFIRMED inside
 * payment.service.ts.
 *
 * Admin can manually cancel a booking.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: UpdateBookingStatus,
) {
  const booking = await BookingModel.findOne({
    bookingId,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  /**
   * Never allow a paid booking to be moved
   * back to PENDING.
   */
  if (status === "PENDING" && booking.paymentStatus === "PAID") {
    throw new Error("A paid booking cannot be moved back to pending");
  }

  /**
   * Already cancelled.
   * Keep operation idempotent.
   */
  if (status === "CANCELLED" && booking.bookingStatus === "CANCELLED") {
    return booking;
  }

  booking.bookingStatus = status;

  await booking.save();

  return booking;
}
