import { Request, Response, NextFunction } from "express";

import * as paymentService from "../services/payment.service";

export async function createPaymentLink(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await paymentService.createPaymentLink(
      String(req.params.bookingId),
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
