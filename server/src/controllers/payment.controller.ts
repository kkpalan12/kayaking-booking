import { Request, Response, NextFunction } from "express";

import {
  createPaymentLink,
  handlePaymentWebhook,
  simulateTestPayment,
} from "../services/payment.service";

/**
 * Create Razorpay Payment Link.
 *
 * POST /api/payments/link/:bookingId
 */
export async function createPaymentLinkController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bookingId = String(req.params.bookingId || "").trim();

    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });

      return;
    }

    const data = await createPaymentLink(bookingId);

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Create payment link failed:", error);

    if (
      error?.statusCode === 429 ||
      error?.status === 429 ||
      error?.error?.code === "RATE_LIMIT_EXCEEDED"
    ) {
      res.status(429).json({
        success: false,
        message:
          "Online payment testing limit has been reached. Please try again later.",
      });

      return;
    }

    if (error?.statusCode === 401 || error?.status === 401) {
      res.status(502).json({
        success: false,
        message:
          "Payment service authentication failed. Please contact support.",
      });

      return;
    }

    if (error?.statusCode >= 400 && error?.statusCode < 500) {
      res.status(error.statusCode).json({
        success: false,
        message:
          error?.error?.description ||
          error?.message ||
          "Unable to create payment.",
      });

      return;
    }

    next(error);
  }
}

/**
 * Development/test-only payment simulation.
 *
 * POST /api/payments/test/:bookingId
 *
 * Protected by admin authentication.
 */
export async function simulateTestPaymentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const bookingId = String(req.params.bookingId || "").trim();

    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });

      return;
    }

    const booking = await simulateTestPayment(bookingId);

    res.status(200).json({
      success: true,
      data: booking,
      message: "Test payment simulated successfully. Booking confirmed.",
    });
  } catch (error: any) {
    console.error("Test payment failed:", error);

    next(error);
  }
}

/**
 * Razorpay Payment Link webhook.
 *
 * The route MUST receive the original raw body.
 */
export async function paymentWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    console.log("====================================");

    console.log("RAZORPAY WEBHOOK RECEIVED");

    console.log("Time:", new Date().toISOString());

    const signatureHeader = req.headers["x-razorpay-signature"];

    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    if (!signature) {
      console.error("Missing Razorpay webhook signature");

      res.status(400).json({
        success: false,
        message: "Missing Razorpay webhook signature",
      });

      return;
    }

    console.log("Signature:", signature);

    if (!Buffer.isBuffer(req.body)) {
      console.error("Webhook body is not a raw Buffer.", {
        bodyType: typeof req.body,
      });

      res.status(500).json({
        success: false,
        message: "Webhook body was not received as raw data",
      });

      return;
    }

    const rawBody = req.body.toString("utf8");

    console.log("Webhook body length:", Buffer.byteLength(rawBody));

    await handlePaymentWebhook(rawBody, signature);

    console.log("RAZORPAY WEBHOOK PROCESSED");

    console.log("====================================");

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("RAZORPAY WEBHOOK ERROR:", error);

    next(error);
  }
}
