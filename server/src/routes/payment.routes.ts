import { Router } from "express";
import express from "express";

import {
  createPaymentLinkController,
  paymentWebhook,
} from "../controllers/payment.controller";

const router = Router();

/**
 * Razorpay webhook.
 *
 * MUST receive raw request body.
 */
router.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  paymentWebhook,
);

/**
 * Create Razorpay Payment Link.
 */
router.post("/link/:bookingId", createPaymentLinkController);

export default router;
