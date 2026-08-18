import { NextFunction, Request, Response } from "express";

import { verifyAdminToken } from "../services/admin-auth.service";

export interface AdminRequest extends Request {
  admin?: {
    email: string;
    role: "ADMIN";
  };
}

function getToken(req: Request): string | null {
  const authorization = req.headers.authorization;

  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.substring(7);
  }

  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((item) => item.trim());

  const adminToken = cookies.find((item) => item.startsWith("admin_token="));

  if (!adminToken) {
    return null;
  }

  return decodeURIComponent(adminToken.substring("admin_token=".length));
}

export function requireAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    const token = getToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Admin authentication required",
      });

      return;
    }

    const payload = verifyAdminToken(token);

    if (payload.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });

      return;
    }

    req.admin = {
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired admin session",
    });
  }
}
