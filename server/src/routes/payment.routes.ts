import { Router } from "express";
import express from "express";

import {
  createPaymentLink,
  paymentWebhook,
} from "../controllers/payment.controller";

const router = Router();

/**
 * Razorpay webhook.
 *
 * Raw body is required for signature verification.
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
router.post("/link/:bookingId", createPaymentLink);

export default router;
