import { Router } from "express";

import {
  loginAdmin,
  getAdminSession,
  logoutAdmin,
} from "../controllers/admin-auth.controller";

import { requireAdmin } from "../middleware/admin-auth.middleware";

const router = Router();

router.post("/login", loginAdmin);

router.get("/me", requireAdmin, getAdminSession);

router.post("/logout", requireAdmin, logoutAdmin);

export default router;
