import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database";

import packageRoutes from "./routes/package.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";

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
 *
 * Kept directly in server.ts because there is
 * no separate health.routes.ts in this project.
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
 * Normal JSON requests.
 *
 * Payment webhook has route-level express.raw()
 * middleware inside payment.routes.ts.
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
 * Payments
 *
 * POST /api/payments/link/:bookingId
 * POST /api/payments/webhook
 */
app.use("/api/payments", paymentRoutes);

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
