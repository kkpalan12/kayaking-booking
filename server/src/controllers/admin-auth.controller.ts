import { Request, Response, NextFunction } from "express";

import {
  authenticateAdmin,
  createAdminToken,
} from "../services/admin-auth.service";

import { AdminRequest } from "../middleware/admin-auth.middleware";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = [
  "HttpOnly",
  "Path=/",
  "Max-Age=28800",
  isProduction ? "Secure" : "",
  isProduction ? "SameSite=None" : "SameSite=Lax",
]
  .filter(Boolean)
  .join("; ");

export async function loginAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const email = String(req.body?.email || "");

    const password = String(req.body?.password || "");

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });

      return;
    }

    const valid = authenticateAdmin(email, password);

    if (!valid) {
      res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });

      return;
    }

    const token = createAdminToken(email.trim().toLowerCase());

    res.setHeader(
      "Set-Cookie",
      `admin_token=${encodeURIComponent(token)}; ${cookieOptions}`,
    );

    res.json({
      success: true,
      data: {
        email: email.trim().toLowerCase(),
        role: "ADMIN",
      },
    });
  } catch (error) {
    next(error);
  }
}

export function getAdminSession(req: AdminRequest, res: Response): void {
  res.json({
    success: true,
    data: {
      authenticated: true,
      email: req.admin?.email,
      role: req.admin?.role,
    },
  });
}

export function logoutAdmin(_req: Request, res: Response): void {
  res.setHeader(
    "Set-Cookie",
    [
      "admin_token=",
      "HttpOnly",
      "Path=/",
      "Max-Age=0",
      isProduction ? "Secure" : "",
      isProduction ? "SameSite=None" : "SameSite=Lax",
    ]
      .filter(Boolean)
      .join("; "),
  );

  res.json({
    success: true,
    message: "Admin logged out",
  });
}
