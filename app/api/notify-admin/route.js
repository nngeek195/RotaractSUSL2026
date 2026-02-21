import { NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebaseAdmin";

function normalizeChatId(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (trimmed.endsWith("@c.us") || trimmed.endsWith("@g.us")) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `${digits}@c.us` : "";
}

function buildMessage({ type, data, payload }) {
  if (type === "relief_request") {
    const { schoolName, district, contactPerson, contactNumber } = data || {};
    return [
      "New Relief Request",
      `School: ${schoolName || "N/A"}`,
      `District: ${district || "N/A"}`,
      `Contact: ${contactPerson || "N/A"}`,
      `Phone: ${contactNumber || "N/A"}`,
    ].join("\n");
  }

  if (type === "donation_offer") {
    const { donorName, district, itemsOffered, contactNumber, paymentSlip } = data || {};
    return [
      "New Donation Offer",
      `Donor: ${donorName || "N/A"}`,
      `District: ${district || "N/A"}`,
      `Items: ${itemsOffered || (paymentSlip ? "Money Donation (Slip)" : "Mixed Items")}`,
      `Phone: ${contactNumber || "N/A"}`,
    ].join("\n");
  }

  return [
    "New Membership Request",
    `Name: ${payload.fullName || "N/A"}`,
    `Email: ${payload.email || "N/A"}`,
    `Faculty: ${payload.faculty || "N/A"}`,
    `Department: ${payload.department || "N/A"}`,
    payload.contact ? `Contact: ${payload.contact}` : null,
  ].filter(Boolean).join("\n");
}

export async function POST(request) {
  try {
    const body = await request.json();
    let { type, data, provider, fullName, email, contact, faculty, department } = body;

    const isMembershipRequest = !type || type === "membership";

    // Membership notification requires an email to resolve pending request details.
    if (isMembershipRequest && !email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Fill missing membership details from pendingRequests.
    if (isMembershipRequest && !fullName && email) {
      try {
        const db = getAdminDb();
        const pendingRef = db.collection("pendingRequests");
        const snapshot = await pendingRef.where("email", "==", email).limit(1).get();

        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          fullName = userData.fullName;
          contact = userData.whatsapp;
          faculty = userData.faculty;
          department = userData.department;
        }
      } catch (dbError) {
        console.error("Failed to fetch user details from Firestore:", dbError);
      }
    }

    // --- CONFIGURATION ---
    let TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
    let TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

    let WAHA_API_URL = process.env.WAHA_API_URL || "";
    let WAHA_API_KEY = process.env.WAHA_API_KEY || "";
    let WAHA_SESSION = process.env.WAHA_SESSION || "default";
    let WAHA_RECIPIENT = process.env.WAHA_RECIPIENT || "";

    try {
      const db = getAdminDb();
      const secureDoc = await db.collection("adminSettings").doc("secure").get();

      if (secureDoc.exists) {
        const secure = secureDoc.data();

        if (secure.telegramBotToken) TELEGRAM_BOT_TOKEN = secure.telegramBotToken;
        if (secure.telegramChatId) TELEGRAM_CHAT_ID = secure.telegramChatId;

        // WAHA primary keys
        if (secure.wahaApiUrl) WAHA_API_URL = secure.wahaApiUrl;
        if (secure.wahaApiKey) WAHA_API_KEY = secure.wahaApiKey;
        if (secure.wahaSession) WAHA_SESSION = secure.wahaSession;
        if (secure.wahaRecipient) WAHA_RECIPIENT = secure.wahaRecipient;

        // Backward compatibility with previous WhatsApp settings fields
        if (!WAHA_API_KEY && secure.inoutApiKey) WAHA_API_KEY = secure.inoutApiKey;
        if (!WAHA_RECIPIENT && secure.inoutPhoneNumber) WAHA_RECIPIENT = secure.inoutPhoneNumber;
      }
    } catch (dbError) {
      console.warn("Failed to fetch admin settings from Firestore (using env fallback):", dbError.message);
    }

    const message = buildMessage({
      type,
      data,
      payload: { fullName, email, contact, faculty, department },
    });

    const results = [];

    // --- VALIDATION FOR EXPLICIT PROVIDER ---
    if (provider === "telegram" && (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)) {
      return NextResponse.json({ error: "Telegram configuration missing", details: "Check Bot Token and Chat ID" }, { status: 400 });
    }

    if (provider === "waha") {
      const missing = [];
      if (!WAHA_API_URL) missing.push("WAHA API URL");
      if (!WAHA_RECIPIENT) missing.push("WAHA Recipient");

      if (missing.length > 0) {
        return NextResponse.json({
          error: "WAHA configuration missing",
          details: `Missing fields: ${missing.join(", ")}`,
        }, { status: 400 });
      }
    }

    // --- 1. Telegram Notification ---
    if ((!provider || provider === "telegram") && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const telegramPromise = fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`Telegram Error: ${await res.text()}`);
        return "Telegram sent";
      });

      results.push(telegramPromise);
    }

    // --- 2. WAHA Notification ---
    if ((!provider || provider === "waha") && WAHA_API_URL && WAHA_RECIPIENT) {
      const baseUrl = WAHA_API_URL.replace(/\/+$/, "");
      const wahaUrl = `${baseUrl}/api/sendText`;
      const chatId = normalizeChatId(WAHA_RECIPIENT);

      const headers = { "Content-Type": "application/json" };
      if (WAHA_API_KEY) {
        headers.Authorization = `Bearer ${WAHA_API_KEY}`;
        headers["X-Api-Key"] = WAHA_API_KEY;
      }

      const wahaPromise = fetch(wahaUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          chatId,
          text: message,
          session: WAHA_SESSION || "default",
        }),
      }).then(async (res) => {
        const responseText = await res.text();
        if (!res.ok) throw new Error(`WAHA Error: ${responseText}`);
        return `WAHA sent to ${chatId}`;
      });

      results.push(wahaPromise);
    }

    if (results.length === 0) {
      return NextResponse.json({
        error: "No notification providers configured",
        details: "Please configure Telegram or WAHA in Admin Settings.",
      }, { status: 400 });
    }

    const outcomes = await Promise.allSettled(results);
    const serializedOutcomes = outcomes.map((o) => {
      if (o.status === "fulfilled") return { status: "fulfilled", value: o.value };
      return { status: "rejected", reason: o.reason?.message || String(o.reason) };
    });

    const failed = serializedOutcomes.filter((r) => r.status === "rejected");

    if (failed.length > 0) {
      const errors = failed.map((r) => r.reason);
      if (failed.length === serializedOutcomes.length) {
        return NextResponse.json({ error: errors[0] || "Failed to notify", details: errors.join(", "), results: serializedOutcomes }, { status: 500 });
      }
      return NextResponse.json({ message: "Notification sent (partial failure)", errors, results: serializedOutcomes }, { status: 200 });
    }

    return NextResponse.json({ message: "Notification sent successfully", results: serializedOutcomes });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}