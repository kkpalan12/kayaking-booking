import crypto from "crypto";

import { BookingModel } from "../models/booking.model";
import { PaymentModel } from "../models/payment.model";

function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature),
  );
}

export async function handlePaymentWebhook(rawBody: Buffer, signature: string) {
  const isValid = verifyWebhookSignature(rawBody, signature);

  if (!isValid) {
    throw new Error("Invalid Razorpay webhook signature");
  }

  const event = JSON.parse(rawBody.toString("utf8"));

  if (event.event !== "payment_link.paid") {
    return {
      processed: false,
      event: event.event,
    };
  }

  const paymentLink = event.payload?.payment_link?.entity;

  const payment = event.payload?.payment?.entity;

  if (!paymentLink) {
    throw new Error("Payment link data missing");
  }

  const bookingId = paymentLink.reference_id;

  if (!bookingId) {
    throw new Error("Booking reference missing");
  }

  const booking = await BookingModel.findOne({
    bookingId,
  });

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  const paymentRecord = await PaymentModel.findOneAndUpdate(
    {
      bookingId: booking._id,
    },
    {
      razorpayPaymentLinkId: paymentLink.id,

      razorpayPaymentId: payment?.id,

      status: "PAID",
    },
    {
      new: true,
    },
  );

  if (!paymentRecord) {
    throw new Error("Payment record not found");
  }

  await BookingModel.findByIdAndUpdate(booking._id, {
    paymentStatus: "PAID",
    bookingStatus: "CONFIRMED",
  });

  return {
    processed: true,
    bookingId,
    paymentId: payment?.id,
  };
}
