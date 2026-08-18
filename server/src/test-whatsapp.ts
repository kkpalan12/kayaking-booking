import dotenv from "dotenv";

import { sendBookingConfirmation } from "./services/whatsapp.service";

dotenv.config();

async function testWhatsApp(): Promise<void> {
  try {
    console.log("----------------------------------");
    console.log("WhatsApp local test started");
    console.log("----------------------------------");

    console.log("Enabled:", process.env.WHATSAPP_ENABLED);

    console.log("Phone Number ID:", process.env.WHATSAPP_PHONE_NUMBER_ID);

    await sendBookingConfirmation({
      customerName: "Karthik",

      customerPhone: "9591797451",

      packageName: "Mangrove Kayaking",

      bookingDate: new Date(),

      timeSlot: "07:00 AM",

      quantity: 2,

      totalAmount: 600,

      bookingId: "KAY-TEST-001",
    });

    console.log("----------------------------------");
    console.log("WhatsApp test completed");
    console.log("----------------------------------");
  } catch (error) {
    console.error("----------------------------------");
    console.error("WhatsApp test FAILED");
    console.error("----------------------------------");
    console.error(error);
    process.exit(1);
  }
}

testWhatsApp();
