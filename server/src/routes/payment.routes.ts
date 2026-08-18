import { Router } from "express";
import express from "express";

import {
  createPaymentLinkController,
  paymentWebhook,
  simulateTestFailedPaymentController,
  simulateTestPaymentController,
  getPublicPaymentStatusController,
} from "../controllers/payment.controller";

import { requireAdmin } from "../middleware/admin-auth.middleware";

const router = Router();

/**
 * Razorpay webhook.
 */
router.post(
  "/webhook",
  express.raw({
    type: "application/json",
  }),
  paymentWebhook,
);

/**
 * Public payment status.
 *
 * Customer confirmation page uses this endpoint.
 */
router.get("/status/:bookingId", getPublicPaymentStatusController);

/**
 * Create Razorpay Payment Link.
 */
router.post("/link/:bookingId", createPaymentLinkController);

/**
 * Development/test-only payment simulation.
 */
router.post("/test/:bookingId", requireAdmin, simulateTestPaymentController);

router.post(
  "/test-failed/:bookingId",
  requireAdmin,
  simulateTestFailedPaymentController,
);

export default router;
