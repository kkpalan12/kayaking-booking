import { Router } from "express";

import {
  verifyWhatsAppWebhook,
  receiveWhatsAppWebhook,
} from "../controllers/whatsapp-webhook.controller";

const router = Router();

/**
 * Meta webhook verification.
 */
router.get("/webhook", verifyWhatsAppWebhook);

/**
 * Meta WhatsApp events.
 */
router.post("/webhook", receiveWhatsAppWebhook);

export default router;
