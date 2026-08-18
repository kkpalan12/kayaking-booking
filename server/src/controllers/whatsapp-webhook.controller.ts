import { Request, Response, NextFunction } from "express";

/**
 * GET /api/whatsapp/webhook
 *
 * Meta uses this request to verify that our
 * webhook URL belongs to our application.
 */
export function verifyWhatsAppWebhook(req: Request, res: Response): void {
  const mode = String(req.query["hub.mode"] || "");

  const token = String(req.query["hub.verify_token"] || "");

  const challenge = String(req.query["hub.challenge"] || "");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error("WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured");

    res.sendStatus(500);

    return;
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("WhatsApp webhook verified successfully");

    res.status(200).send(challenge);

    return;
  }

  console.error("WhatsApp webhook verification failed");

  res.sendStatus(403);
}

/**
 * POST /api/whatsapp/webhook
 *
 * Meta sends WhatsApp webhook events here.
 */
export function receiveWhatsAppWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    console.log("====================================");

    console.log("WHATSAPP WEBHOOK RECEIVED");

    console.log("Time:", new Date().toISOString());

    console.log("Webhook payload:", JSON.stringify(req.body));

    /**
     * WhatsApp webhooks can contain different
     * event types, including:
     *
     * - incoming messages
     * - message status changes
     * - delivery/read events
     */
    const body = req.body;

    if (body?.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          console.log("WhatsApp webhook field:", change.field);

          if (value?.messages) {
            console.log("WhatsApp incoming messages:", value.messages);
          }

          if (value?.statuses) {
            console.log("WhatsApp message statuses:", value.statuses);
          }
        }
      }
    }

    console.log("WHATSAPP WEBHOOK PROCESSED");

    console.log("====================================");

    /**
     * Meta expects a successful HTTP response.
     */
    res.sendStatus(200);
  } catch (error) {
    console.error("WhatsApp webhook processing error:", error);

    next(error);
  }
}
