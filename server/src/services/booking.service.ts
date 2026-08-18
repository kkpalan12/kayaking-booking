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

function generateBookingId(): string {
  const date = new Date();

  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `KAY-${datePart}-${randomPart}`;
}

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

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const billableQuantity =
    packageData.pricingType === "PER_BOOKING" ? 1 : quantity;

  const subtotal = packageData.price * billableQuantity;

  let discountAmount = 0;

  if (packageData.discount.enabled && packageData.discount.value > 0) {
    if (packageData.discount.type === "PERCENTAGE") {
      discountAmount = subtotal * (packageData.discount.value / 100);
    } else {
      discountAmount = packageData.discount.value;
    }
  }

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

export async function createBooking(input: CreateBookingInput) {
  const pricing = await calculateBookingPrice(input.packageId, input.quantity);

  const booking = await BookingModel.create({
    bookingId: generateBookingId(),

    packageId: pricing.packageData._id,

    packageName: pricing.packageData.name,
    pricingType: pricing.packageData.pricingType,
    unitPrice: pricing.packageData.price,

    customerName: input.customerName,
    customerPhone: input.customerPhone,

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

export async function getBookingById(bookingId: string) {
  return BookingModel.findOne({
    bookingId,
  });
}

export async function getBookings() {
  return BookingModel.find().sort({ createdAt: -1 });
}
