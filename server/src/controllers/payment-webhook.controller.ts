import { Request, Response, NextFunction } from "express";

import { handlePaymentWebhook } from "../services/payment-webhook.service";

export async function paymentWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (typeof signature !== "string") {
      res.status(400).json({
        success: false,
        message: "Missing webhook signature",
      });

      return;
    }

    await handlePaymentWebhook(req.body as Buffer, signature);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}
