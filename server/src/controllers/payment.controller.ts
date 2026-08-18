import { Request, Response } from "express";

import * as paymentService from "../services/payment.service";

export async function createPaymentLink(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const bookingId =
      typeof req.params.bookingId === "string"
        ? req.params.bookingId
        : undefined;

    if (!bookingId) {
      res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });

      return;
    }

    const data = await paymentService.createPaymentLink(bookingId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Create payment link error:", error);

    res.status(400).json({
      success: false,
      message: error?.message || "Unable to create payment link",
    });
  }
}

export async function paymentWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (typeof signature !== "string") {
      res.status(400).json({
        success: false,
        message: "Missing Razorpay signature",
      });

      return;
    }

    if (!Buffer.isBuffer(req.body)) {
      res.status(400).json({
        success: false,
        message: "Invalid webhook body",
      });

      return;
    }

    const rawBody = req.body.toString("utf8");

    await paymentService.handlePaymentWebhook(rawBody, signature);

    res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);

    res.status(400).json({
      success: false,
      message: error?.message || "Webhook verification failed",
    });
  }
}
