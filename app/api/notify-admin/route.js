import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../lib/firebaseAdmin";

function normalizeChatId(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (trimmed.endsWith("@c.us") || trimmed.endsWith("@g.us")) return trimmed;
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `${digits}@c.us` : "";
}

function buildWahaSendTextUrl(rawUrl) {
  const base = String(rawUrl || "").trim().replace(/\/+$/, "");
  if (!base) return "";
  if (/\/api\/sendText$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/sendText`;
  return `${base}/api/sendText`;
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

  if (type === "contact_message") {
    const { name, email, subject, message } = data || {};
    return [
      "New Contact Message",
      `Name: ${name || "N/A"}`,
      `Email: ${email || "N/A"}`,
      `Subject: ${subject || "N/A"}`,
      "Message:",
      message || "N/A",
    ].join("\n");
  }

  return [
    "New Member Joined",
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

    // Resolve membership details from users (or pendingRequests fallback)
    if (isMembershipRequest && email) {
      try {
        const db = getAdminDb();
        const usersSnap = await db.collection("users").where("email", "==", email).limit(1).get();

        if (!usersSnap.empty) {
          const userData = usersSnap.docs[0].data();
          if (!fullName) fullName = userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          if (!contact) contact = userData.whatsapp || userData.mobileNumber;
          if (!faculty) faculty = userData.faculty;
          if (!department) department = userData.department;
        } else {
          const pendingSnap = await db.collection("pendingRequests").where("email", "==", email).limit(1).get();
          if (!pendingSnap.empty) {
            const pendingData = pendingSnap.docs[0].data();
            if (!fullName) fullName = pendingData.fullName || `${pendingData.firstName || ''} ${pendingData.lastName || ''}`.trim();
            if (!contact) contact = pendingData.whatsapp || pendingData.mobileNumber;
            if (!faculty) faculty = pendingData.faculty;
            if (!department) department = pendingData.department;
          }
        }
      } catch (dbError) {
        console.error("Failed to fetch user details from Firestore:", dbError);
      }
    }

    // Ensure membership notifications are sent only after email verification.
    if (isMembershipRequest && email) {
      try {
        const auth = getAdminAuth();
        const userRecord = await auth.getUserByEmail(email);
        if (!userRecord.emailVerified) {
          return NextResponse.json(
            { error: "Email is not verified yet" },
            { status: 400 }
          );
        }
      } catch (authError) {
        console.error("Failed to verify auth user:", authError);
        return NextResponse.json(
          { error: "Unable to verify user email status" },
          { status: 400 }
        );
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
      const wahaUrl = buildWahaSendTextUrl(WAHA_API_URL);
      const chatId = normalizeChatId(WAHA_RECIPIENT);
      const looksLocalhost = /(^https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(
        String(WAHA_API_URL || "").trim()
      );

      const headers = { "Content-Type": "application/json" };
      if (WAHA_API_KEY) {
        headers.Authorization = `Bearer ${WAHA_API_KEY}`;
        headers["X-Api-Key"] = WAHA_API_KEY;
      }

      const wahaPromise = (async () => {
        try {
          const res = await fetch(wahaUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              chatId,
              text: message,
              session: WAHA_SESSION || "default",
            }),
          });
          const responseText = await res.text();
          if (!res.ok) throw new Error(`WAHA Error: ${responseText}`);
          return `WAHA sent to ${chatId}`;
        } catch (err) {
          const hint = looksLocalhost
            ? " WAHA API URL uses localhost/127.0.0.1; this is not reachable from deployed server environments."
            : "";
          throw new Error(
            `WAHA network/request failed at ${wahaUrl}. ${err?.message || String(err)}${hint}`
          );
        }
      })();

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
