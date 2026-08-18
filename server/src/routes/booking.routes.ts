import { Router } from "express";

import {
  createBooking,
  getBooking,
  getBookings,
  updateBookingStatus,
} from "../controllers/booking.controller";

import { requireAdmin } from "../middleware/admin-auth.middleware";

const router = Router();

/**
 * Public customer booking.
 */
router.post("/", createBooking);

/**
 * Admin booking management.
 */
router.get("/", requireAdmin, getBookings);

router.get("/:bookingId", requireAdmin, getBooking);

router.patch("/:bookingId/status", requireAdmin, updateBookingStatus);

export default router;
