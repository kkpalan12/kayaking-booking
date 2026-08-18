import jwt from "jsonwebtoken";

interface AdminTokenPayload {
  email: string;
  role: "ADMIN";
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function authenticateAdmin(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are not configured");
  }

  return (
    email.trim().toLowerCase() === adminEmail.trim().toLowerCase() &&
    password === adminPassword
  );
}

export function createAdminToken(email: string): string {
  const payload: AdminTokenPayload = {
    email,
    role: "ADMIN",
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "8h",
  });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  return jwt.verify(token, getJwtSecret()) as AdminTokenPayload;
}
