import express, { NextFunction, Request, Response } from "express";

import cors from "cors";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database";

import packageRoutes from "./routes/package.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
import googleReviewsRoutes from "./routes/google-reviews.routes";
import adminAuthRoutes from "./routes/admin-auth.routes";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5000;

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:4200";

/**
 * CORS
 */
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

/**
 * Health
 */
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Kayaking API is running",
  });
});

app.get("/api/health/ready", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Kayaking API is ready",
  });
});

/**
 * IMPORTANT
 *
 * Payment webhook must be registered BEFORE
 * express.json() so the webhook route receives
 * the original raw request body.
 */
app.use("/api/payments", paymentRoutes);

/**
 * Normal JSON requests.
 */
app.use(express.json());

/**
 * Packages
 */
app.use("/api/packages", packageRoutes);

/**
 * Bookings
 */
app.use("/api/bookings", bookingRoutes);

/**
 * Admin authentication
 */
app.use("/api/admin/auth", adminAuthRoutes);

/**
 * Google reviews
 */
app.use("/api/google-reviews", googleReviewsRoutes);

/**
 * 404
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/**
 * Global error handler
 */
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled server error:", error);

  res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.message || "Internal server error",
  });
});

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Kayaking API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
}

startServer();

export default app;
