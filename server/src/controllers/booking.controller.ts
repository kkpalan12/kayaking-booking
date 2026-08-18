import { Request, Response, NextFunction } from "express";

import * as bookingService from "../services/booking.service";

export async function createBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const booking = await bookingService.createBooking(req.body);

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBooking(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const booking = await bookingService.getBookingById(
      String(req.params.bookingId),
    );

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const bookings = await bookingService.getBookings();

    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
}
