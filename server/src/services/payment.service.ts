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

/**
 * Create a Razorpay Payment Link.
 */
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

  try {
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
  } catch (error: any) {
    console.error("Create payment link failed:", error);

    throw error;
  }
}

/**
 * Verify Razorpay webhook signature.
 */
function verifyWebhookSignature(rawBody: string, signature: string): void {
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
}

/**
 * Send WhatsApp confirmation.
 *
 * WhatsApp failure must NOT make the Razorpay webhook fail,
 * because payment has already been successfully processed.
 */
async function sendWhatsAppConfirmation(booking: any) {
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

/**
 * Handle successful Payment Link.
 */
async function handlePaymentLinkPaid(paymentLink: any): Promise<void> {
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

  /**
   * Idempotency protection.
   *
   * Razorpay can retry webhook delivery.
   *
   * If the booking was already paid, don't send
   * another WhatsApp confirmation.
   */
  if (booking.paymentStatus === "PAID") {
    console.log(
      `Booking ${bookingId} is already PAID. Skipping duplicate webhook.`,
    );

    return;
  }

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

  console.log(`Booking ${bookingId} marked PAID and CONFIRMED.`);

  await sendWhatsAppConfirmation(booking);
}

/**
 * Handle cancelled or expired Payment Link.
 *
 * Customer has NOT cancelled the booking.
 *
 * Only the payment attempt failed/cancelled/expired.
 *
 * Therefore:
 *
 * paymentStatus = FAILED
 * bookingStatus = PENDING
 */
async function handlePaymentLinkFailed(
  paymentLink: any,
  eventName: string,
): Promise<void> {
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

  /**
   * Never downgrade a successfully paid booking.
   *
   * This protects against an old/stale cancelled or
   * expired webhook arriving after payment.
   */
  if (booking.paymentStatus === "PAID") {
    console.log(`Ignoring ${eventName} for already-paid booking ${bookingId}.`);

    return;
  }

  await PaymentModel.findOneAndUpdate(
    {
      bookingId: booking._id,
    },
    {
      bookingId: booking._id,

      amount: booking.totalAmount,

      currency: "INR",

      razorpayPaymentLinkId: paymentLink.id,

      status: "FAILED",
    },
    {
      upsert: true,

      new: true,
    },
  );

  booking.paymentStatus = "FAILED";

  booking.bookingStatus = "PENDING";

  await booking.save();

  console.log(`Booking ${bookingId} payment marked FAILED.`);

  console.log(`Booking ${bookingId} remains PENDING.`);
}

/**
 * Handles Razorpay Payment Link webhooks.
 *
 * Supported events:
 *
 * payment_link.paid
 * payment_link.cancelled
 * payment_link.expired
 *
 * IMPORTANT:
 * rawBody MUST be the original request body.
 */
export async function handlePaymentWebhook(
  rawBody: string,
  signature: string,
): Promise<void> {
  verifyWebhookSignature(rawBody, signature);

  let event: any;

  try {
    event = JSON.parse(rawBody);
  } catch {
    throw new Error("Invalid Razorpay webhook JSON");
  }

  console.log("Razorpay webhook event:", event.event);

  /**
   * Ignore events that are not relevant to
   * our Payment Link workflow.
   */
  const supportedEvents = [
    "payment_link.paid",
    "payment_link.cancelled",
    "payment_link.expired",
  ];

  if (!supportedEvents.includes(event.event)) {
    console.log(`Ignoring unsupported Razorpay event: ${event.event}`);

    return;
  }

  const paymentLink = event.payload?.payment_link?.entity;

  if (!paymentLink) {
    throw new Error("Payment link data missing from webhook");
  }

  console.log("Payment Link ID:", paymentLink.id);

  console.log("Booking Reference:", paymentLink.reference_id);

  switch (event.event) {
    case "payment_link.paid":
      await handlePaymentLinkPaid(paymentLink);
      break;

    case "payment_link.cancelled":
      await handlePaymentLinkFailed(paymentLink, event.event);
      break;

    case "payment_link.expired":
      await handlePaymentLinkFailed(paymentLink, event.event);
      break;

    default:
      break;
  }
}

/**
 * Development/test-only payment simulation.
 *
 * NEVER calls Razorpay.
 *
 * This simulates:
 *
 * payment_link.paid
 *
 * It exists so the complete booking workflow can be
 * tested when Razorpay Test Mode limits are exhausted.
 */
export async function simulateTestPayment(bookingId: string) {
  if (process.env.ENABLE_TEST_PAYMENT_FLOW !== "true") {
    const error = new Error("Test payment flow is disabled") as Error & {
      statusCode?: number;
    };

    error.statusCode = 403;

    throw error;
  }

  const booking = await BookingModel.findOne({
    bookingId,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.paymentStatus === "PAID") {
    return booking;
  }

  const testPaymentLinkId = `test_link_${booking.bookingId}`;

  await PaymentModel.findOneAndUpdate(
    {
      bookingId: booking._id,
    },
    {
      bookingId: booking._id,

      amount: booking.totalAmount,

      currency: "INR",

      razorpayPaymentLinkId: testPaymentLinkId,

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

  await sendWhatsAppConfirmation(booking);

  return booking;
}
/**
 * Development/test-only failed payment simulation.
 *
 * NEVER calls Razorpay.
 *
 * Simulates:
 *
 * payment_link.cancelled
 *
 * Result:
 * paymentStatus = FAILED
 * bookingStatus = PENDING
 *
 * This is disabled automatically when
 * ENABLE_TEST_PAYMENT_FLOW !== "true".
 */
export async function simulateTestFailedPayment(bookingId: string) {
  if (process.env.ENABLE_TEST_PAYMENT_FLOW !== "true") {
    const error = new Error("Test payment flow is disabled") as Error & {
      statusCode?: number;
    };

    error.statusCode = 403;

    throw error;
  }

  const booking = await BookingModel.findOne({
    bookingId,
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  /**
   * Never downgrade a successfully paid booking.
   */
  if (booking.paymentStatus === "PAID") {
    throw new Error("A paid booking cannot be marked as failed");
  }

  const testPaymentLinkId = `test_failed_link_${booking.bookingId}`;

  await PaymentModel.findOneAndUpdate(
    {
      bookingId: booking._id,
    },
    {
      bookingId: booking._id,

      amount: booking.totalAmount,

      currency: "INR",

      razorpayPaymentLinkId: testPaymentLinkId,

      status: "FAILED",
    },
    {
      upsert: true,

      new: true,
    },
  );

  booking.paymentStatus = "FAILED";

  booking.bookingStatus = "PENDING";

  await booking.save();

  console.log(`TEST PAYMENT FAILED: ${booking.bookingId}`);

  console.log("paymentStatus = FAILED");

  console.log("bookingStatus = PENDING");

  /*
   * IMPORTANT:
   *
   * No WhatsApp confirmation is sent.
   *
   * Payment was not successful.
   */

  return booking;
}
/**
 * Public payment-status lookup.
 *
 * IMPORTANT:
 * This intentionally returns only safe booking/payment
 * information required by the customer confirmation page.
 *
 * No phone number or sensitive admin information is exposed.
 */
export async function getPublicPaymentStatus(bookingId: string) {
  const booking = await BookingModel.findOne({
    bookingId,
  }).select(
    "bookingId packageName bookingDate timeSlot quantity totalAmount paymentStatus bookingStatus",
  );

  if (!booking) {
    const error = new Error("Booking not found") as Error & {
      statusCode?: number;
    };

    error.statusCode = 404;

    throw error;
  }

  return booking;
}
