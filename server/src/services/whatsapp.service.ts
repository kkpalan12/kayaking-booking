import https from "https";

interface WhatsAppMessageData {
  customerName: string;
  customerPhone: string;
  packageName: string;
  bookingDate: Date | string;
  timeSlot: string;
  quantity: number;
  totalAmount: number;
  bookingId: string;
}

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";

  if (!accessToken || !phoneNumberId) {
    throw new Error("WhatsApp is not configured");
  }

  return {
    accessToken,
    phoneNumberId,
    apiVersion,
  };
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }

  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return cleaned;
  }

  return cleaned;
}

function formatBookingDate(date: Date | string): string {
  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date);
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function postToWhatsApp(
  url: string,
  accessToken: string,
  body: object,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);

    const request = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
      (response) => {
        let responseData = "";

        response.on("data", (chunk) => {
          responseData += chunk;
        });

        response.on("end", () => {
          let parsedData: any;

          try {
            parsedData = JSON.parse(responseData);
          } catch {
            parsedData = responseData;
          }

          if (
            response.statusCode &&
            response.statusCode >= 200 &&
            response.statusCode < 300
          ) {
            resolve(parsedData);
            return;
          }

          reject(
            new Error(
              `WhatsApp API error ${response.statusCode}: ${responseData}`,
            ),
          );
        });
      },
    );

    request.on("error", reject);

    request.write(JSON.stringify(body));

    request.end();
  });
}

export async function sendBookingConfirmation(
  data: WhatsAppMessageData,
): Promise<void> {
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log("WhatsApp disabled. Skipping confirmation.");

    return;
  }

  const { accessToken, phoneNumberId, apiVersion } = getConfig();

  const phone = normalizePhone(data.customerPhone);

  const bookingDate = formatBookingDate(data.bookingDate);

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  await postToWhatsApp(url, accessToken, {
    messaging_product: "whatsapp",

    to: phone,

    type: "template",

    template: {
      name: "kayaking_booking_confirm",

      language: {
        code: "en_US",
      },

      components: [
        {
          type: "body",

          parameters: [
            {
              type: "text",
              text: data.customerName,
            },
            {
              type: "text",
              text: data.packageName,
            },
            {
              type: "text",
              text: bookingDate,
            },
            {
              type: "text",
              text: data.timeSlot,
            },
            {
              type: "text",
              text: String(data.quantity),
            },
            {
              type: "text",
              text: `₹${data.totalAmount}`,
            },
            {
              type: "text",
              text: data.bookingId,
            },
          ],
        },
      ],
    },
  });

  console.log(`WhatsApp confirmation sent for ${data.bookingId}`);
}
