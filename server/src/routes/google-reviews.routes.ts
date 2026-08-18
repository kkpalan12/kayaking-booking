import { Router } from "express";

import { getGoogleReviewsController } from "../controllers/google-reviews.controller";

const router = Router();

router.get("/", getGoogleReviewsController);

export default router;
