import { Request, Response, NextFunction } from "express";

import { handlePaymentWebhook } from "../services/payment.service";

export async function createPaymentLink(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const bookingId = String(req.params.bookingId);

    const data = await import("../services/payment.service").then((service) =>
      service.createPaymentLink(bookingId),
    );

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function paymentWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("====================================");

    console.log("RAZORPAY WEBHOOK RECEIVED");

    console.log("Time:", new Date().toISOString());

    console.log("Signature:", req.headers["x-razorpay-signature"]);

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : String(req.body);

    console.log("Webhook body:", rawBody);

    const signature = String(req.headers["x-razorpay-signature"] || "");

    if (!signature) {
      res.status(400).json({
        success: false,
        message: "Missing Razorpay webhook signature",
      });

      return;
    }

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
