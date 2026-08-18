import Razorpay from "razorpay";

import { BookingModel } from "../models/booking.model";
import { PaymentModel } from "../models/payment.model";

function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createPaymentLink(bookingId: string) {
  const booking = await BookingModel.findOne({
    bookingId,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.paymentStatus === "PAID") {
    throw new Error("Booking is already paid");
  }

  if (booking.totalAmount <= 0) {
    throw new Error("Invalid booking amount");
  }

  const razorpay = getRazorpayClient();

  const amountInPaise = Math.round(booking.totalAmount * 100);

  const paymentLink = await razorpay.paymentLink.create({
    amount: amountInPaise,
    currency: "INR",

    accept_partial: false,

    reference_id: booking.bookingId,

    description: `${booking.packageName} - ${booking.bookingId}`,

    customer: {
      name: booking.customerName,
      contact: booking.customerPhone,
    },

    notify: {
      sms: false,
      email: false,
    },

    reminder_enable: false,

    notes: {
      booking_id: booking.bookingId,
      package_name: booking.packageName,
    },
  });

  await PaymentModel.findOneAndUpdate(
    {
      bookingId: booking._id,
    },
    {
      bookingId: booking._id,
      amount: booking.totalAmount,
      currency: "INR",
      razorpayPaymentLinkId: paymentLink.id,
      status: "CREATED",
    },
    {
      upsert: true,
      new: true,
    },
  );

  return {
    bookingId: booking.bookingId,
    amount: booking.totalAmount,
    currency: "INR",
    paymentLinkId: paymentLink.id,
    paymentUrl: paymentLink.short_url,
  };
}
