import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import packageRoutes from "./routes/package.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";

import { paymentWebhook } from "./controllers/payment-webhook.controller";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4200",
  }),
);

/*
 * Razorpay webhook MUST receive
 * the raw request body.
 */
app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  paymentWebhook,
);

/*
 * Normal JSON requests
 */
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Kayaking API is running",
  });
});

app.use("/api/packages", packageRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/payments", paymentRoutes);

app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  },
);

export default app;
