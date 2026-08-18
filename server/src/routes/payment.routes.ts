import { Router } from "express";

import { createPaymentLink } from "../controllers/payment.controller";

const router = Router();

router.post("/link/:bookingId", createPaymentLink);

export default router;
