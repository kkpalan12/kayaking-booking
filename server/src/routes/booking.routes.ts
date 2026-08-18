import { Router } from "express";

import {
  createBooking,
  getBooking,
  getBookings,
} from "../controllers/booking.controller";

const router = Router();

router.post("/", createBooking);

router.get("/", getBookings);

router.get("/:bookingId", getBooking);

export default router;
