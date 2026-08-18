import crypto from "crypto";
import Razorpay from "razorpay";

import { BookingModel } from "../models/booking.model";
import { PaymentModel } from "../models/payment.model";
import { sendBookingConfirmation } from "./whatsapp.service";

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

  const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";

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

    callback_url: `${clientUrl}/payment-success`,

    callback_method: "get",

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

/**
 * Handles Razorpay payment_link.paid webhook.
 *
 * IMPORTANT:
 * rawBody MUST be the original request body.
 */
export async function handlePaymentWebhook(
  rawBody: string,
  signature: string,
): Promise<void> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    throw new Error("Invalid Razorpay webhook signature");
  }

  if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new Error("Invalid Razorpay webhook signature");
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "payment_link.paid") {
    return;
  }

  const paymentLink = event.payload?.payment_link?.entity;

  if (!paymentLink) {
    throw new Error("Payment link data missing from webhook");
  }

  const bookingId = paymentLink.reference_id;

  if (!bookingId) {
    throw new Error("Booking reference missing from payment link");
  }

  const booking = await BookingModel.findOne({
    bookingId,
  });

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  /*
   * Idempotency:
   * Razorpay may retry webhook delivery.
   * Updating an already-paid booking is safe.
   */
  await PaymentModel.findOneAndUpdate(
    {
      bookingId: booking._id,
    },
    {
      bookingId: booking._id,
      amount: booking.totalAmount,
      currency: "INR",
      razorpayPaymentLinkId: paymentLink.id,
      status: "PAID",
    },
    {
      upsert: true,
      new: true,
    },
  );

  booking.paymentStatus = "PAID";
  booking.bookingStatus = "CONFIRMED";

  await booking.save();
  try {
    await sendBookingConfirmation({
      customerName: booking.customerName,

      customerPhone: booking.customerPhone,

      packageName: booking.packageName,

      bookingDate: booking.bookingDate,

      timeSlot: booking.timeSlot,

      quantity: booking.quantity,

      totalAmount: booking.totalAmount,

      bookingId: booking.bookingId,
    });
  } catch (error) {
    console.error("WhatsApp confirmation failed:", error);
  }
}
