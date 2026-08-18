import { Request, Response, NextFunction } from "express";

import {
  createPaymentLink,
  getPublicPaymentStatus,
  handlePaymentWebhook,
  simulateTestFailedPayment,
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

    /**
     * Razorpay Test Mode Payment Link limit.
     */
    if (
      error?.statusCode === 429 ||
      error?.status === 429 ||
      error?.error?.code === "RATE_LIMIT_EXCEEDED"
    ) {
      res.status(429).json({
        success: false,

        code: "PAYMENT_TEST_LIMIT_REACHED",

        message:
          "Online payment testing limit has been reached. Please use an existing test payment link or try again later.",
      });

      return;
    }

    /**
     * Razorpay authentication error.
     */
    if (error?.statusCode === 401 || error?.status === 401) {
      res.status(502).json({
        success: false,

        code: "PAYMENT_AUTHENTICATION_FAILED",

        message:
          "Payment service authentication failed. Please contact support.",
      });

      return;
    }

    /**
     * Other Razorpay 4xx errors.
     */
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
 * IMPORTANT:
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

    /**
     * Razorpay signature verification requires
     * the original raw request body.
     */
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

    /**
     * Always acknowledge successfully after
     * the webhook has been processed.
     */
    res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error("RAZORPAY WEBHOOK ERROR:", error);

    /**
     * Signature errors are client/authentication
     * errors, not server errors.
     */
    if (error?.message === "Invalid Razorpay webhook signature") {
      res.status(400).json({
        success: false,

        message: "Invalid Razorpay webhook signature",
      });

      return;
    }

    if (error?.message === "Missing Razorpay webhook signature") {
      res.status(400).json({
        success: false,

        message: "Missing Razorpay webhook signature",
      });

      return;
    }

    next(error);
  }
}
/**
 * Development/test-only failed payment simulation.
 *
 * POST /api/payments/test-failed/:bookingId
 *
 * Protected by admin authentication.
 */
export async function simulateTestFailedPaymentController(
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

    const booking = await simulateTestFailedPayment(bookingId);

    res.status(200).json({
      success: true,

      data: booking,

      message:
        "Test failed payment simulated successfully. Booking remains pending.",
    });
  } catch (error: any) {
    console.error("Test failed payment failed:", error);

    next(error);
  }
}
/**
 * Public payment-status lookup.
 *
 * GET /api/payments/status/:bookingId
 *
 * This endpoint is intentionally public because the
 * customer confirmation page needs to verify the
 * payment after Razorpay redirects back.
 */
export async function getPublicPaymentStatusController(
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

    const booking = await getPublicPaymentStatus(bookingId);

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    console.error("Get public payment status failed:", error);

    if (error?.statusCode === 404) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });

      return;
    }

    next(error);
  }
}
