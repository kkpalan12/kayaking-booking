import { Router } from "express";

import {
  getPackages,
  getAdminPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from "../controllers/package.controller";

const router = Router();

router.get("/", getPackages);

router.get("/admin/all", getAdminPackages);

router.post("/admin", createPackage);

router.put("/admin/:id", updatePackage);

router.delete("/admin/:id", deletePackage);

export default router;
