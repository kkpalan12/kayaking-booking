import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import packageRoutes from "./routes/package.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
import { paymentWebhook } from "./controllers/payment-webhook.controller";

dotenv.config();

const app = express();

/**
 * ---------------------------------------------------------
 * CORS
 * ---------------------------------------------------------
 * Allow the deployed Angular frontend and local development.
 *
 * CLIENT_URL should contain your deployed frontend URL.
 * Example:
 * CLIENT_URL=https://your-frontend.onrender.com
 */
const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:4200"]
  .filter(Boolean)
  .map((origin) => origin!.replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests that don't contain an Origin header
      // (server-to-server, health checks, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },

    // Required for authenticated admin requests
    // withCredentials: true,
  }),
);

/**
 * ---------------------------------------------------------
 * Razorpay Webhook
 * ---------------------------------------------------------
 * MUST receive the raw request body.
 * Keep this BEFORE express.json().
 */
app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  paymentWebhook,
);

/**
 * ---------------------------------------------------------
 * Normal JSON requests
 * ---------------------------------------------------------
 */
app.use(express.json());

/**
 * ---------------------------------------------------------
 * Health
 * ---------------------------------------------------------
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Kayaking API is running",
  });
});

/**
 * ---------------------------------------------------------
 * API Routes
 * ---------------------------------------------------------
 */
app.use("/api/packages", packageRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/payments", paymentRoutes);

/**
 * ---------------------------------------------------------
 * Global Error Handler
 * ---------------------------------------------------------
 */
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
