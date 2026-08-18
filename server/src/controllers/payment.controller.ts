import { Request, Response, NextFunction } from "express";

import {
  createPaymentLink,
  handlePaymentWebhook,
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
    const bookingId = String(req.params.bookingId);

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
  } catch (error) {
    next(error);
  }
}

/**
 * Razorpay Payment Link webhook.
 *
 * IMPORTANT:
 * The route uses express.raw() and therefore
 * req.body MUST be a Buffer.
 *
 * This raw body is required for Razorpay
 * HMAC signature verification.
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

    /**
     * Razorpay sends:
     *
     * X-Razorpay-Signature
     */
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
     * IMPORTANT:
     *
     * Do NOT JSON.stringify(req.body).
     * Do NOT parse the body before signature
     * verification.
     *
     * Razorpay signs the original raw body.
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
     * Razorpay expects a successful 2xx response.
     */
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("RAZORPAY WEBHOOK ERROR:", error);

    next(error);
  }
}
