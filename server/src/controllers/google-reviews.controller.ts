import { Request, Response } from "express";

import { getGoogleReviews } from "../services/google-reviews.service";

export async function getGoogleReviewsController(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const data = await getGoogleReviews();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("Failed to load Google reviews:", error);

    res.status(500).json({
      success: false,
      message: error?.message || "Unable to load Google reviews",
    });
  }
}
