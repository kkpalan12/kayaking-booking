import { Router } from "express";

import {
  getPackages,
  getAdminPackages,
  createPackage,
  updatePackage,
  deletePackage,
  activatePackage,
} from "../controllers/package.controller";

import { requireAdmin } from "../middleware/admin-auth.middleware";

const router = Router();

/**
 * Public customer-facing packages.
 */
router.get("/", getPackages);

/**
 * Admin package management.
 */
router.get("/admin/all", requireAdmin, getAdminPackages);

router.post("/admin", requireAdmin, createPackage);

router.put("/admin/:id", requireAdmin, updatePackage);

/**
 * Safe deactivate.
 */
router.delete("/admin/:id", requireAdmin, deletePackage);

/**
 * Reactivate.
 */
router.patch("/admin/:id/activate", requireAdmin, activatePackage);

export default router;
