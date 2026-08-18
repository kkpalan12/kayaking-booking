import { Router } from "express";
import express from "express";

import {
  createPaymentLinkController,
  paymentWebhook,
  simulateTestPaymentController,
} from "../controllers/payment.controller";

import { requireAdmin } from "../middleware/admin-auth.middleware";

const router = Router();

/**
 * Razorpay webhook.
 *
 * IMPORTANT:
 * This must remain before express.json()
 * and must receive the raw body.
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

/**
 * Development/test-only payment simulation.
 *
 * Admin authentication required.
 *
 * This endpoint does not call Razorpay.
 */
router.post("/test/:bookingId", requireAdmin, simulateTestPaymentController);

export default router;
