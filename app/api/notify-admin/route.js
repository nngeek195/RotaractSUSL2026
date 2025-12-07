import { NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();
    let { fullName, email, contact, faculty, department, provider } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // If details are missing, fetch from Firestore (using Admin SDK)
    if (!fullName) {
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
        } else {
          console.warn(`No pending request found for email: ${email}`);
          // Proceed with minimal data or return? Let's proceed with what we have.
        }
      } catch (dbError) {
        console.error("Failed to fetch user details from Firestore:", dbError);
      }
    }

    // --- CONFIGURATION ---
    let TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
    let TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
    
    // InOut.bot Config
    let INOUT_KEY = "";
    let INOUT_PHONE = "";

    // Try fetching from Firestore Secure Settings (adminSettings/secure)
    try {
      const db = getAdminDb();
      const secureDoc = await db.collection("adminSettings").doc("secure").get();
      
      if (secureDoc.exists) {
        const data = secureDoc.data();
        if (data.telegramBotToken) TELEGRAM_BOT_TOKEN = data.telegramBotToken;
        if (data.telegramChatId) TELEGRAM_CHAT_ID = data.telegramChatId;
        
        if (data.inoutApiKey) INOUT_KEY = data.inoutApiKey;
        if (data.inoutPhoneNumber) INOUT_PHONE = data.inoutPhoneNumber;
      }
    } catch (dbError) {
      console.warn("Failed to fetch admin settings from Firestore (using env vars fallback):", dbError.message);
    }
    
    const results = [];

    // 3. Construct Message
    const message = `
🆕 *New Membership Request*

👤 *Name:* ${fullName}
📧 *Email:* ${email}
🎓 *Faculty:* ${faculty}
🏫 *Dept:* ${department || "N/A"}
    `.trim();

    // --- VALIDATION FOR EXPLICIT PROVIDER ---
    if (provider === 'telegram' && (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID)) {
        return NextResponse.json({ error: "Telegram configuration missing", details: "Check Bot Token and Chat ID" }, { status: 400 });
    }

    if (provider === 'inout') {
        const missing = [];
        if (!INOUT_KEY) missing.push("API Key");
        if (!INOUT_PHONE) missing.push("Recipient Phone Number");

        if (missing.length > 0) {
            return NextResponse.json({ 
                error: "InOut.bot configuration missing", 
                details: `Missing fields: ${missing.join(", ")}` 
            }, { status: 400 });
        }
    }

    // --- 1. Telegram Notification ---
    if ((!provider || provider === 'telegram') && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const promise = fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        }).then(async res => {
            if (!res.ok) throw new Error(`Telegram Error: ${await res.text()}`);
            return "Telegram sent";
        });
        results.push(promise);
    }

    // --- 2. InOut.bot Notification (WhatsApp) ---
    if ((!provider || provider === 'inout') && INOUT_KEY && INOUT_PHONE) {
        // InOut.bot strips newlines, so we use a single-line format
        const cleanMessage = `🆕 Request | 👤 ${fullName} | 📧 ${email} | 🎓 ${faculty} | 🏫 ${department || "N/A"}`;
        const encodedMessage = encodeURIComponent(cleanMessage);
        
        const url = `https://api.inout.bot/send?apikey=${INOUT_KEY}&phone_number=${INOUT_PHONE}&message=${encodedMessage}`;
        
        const promise = fetch(url)
        .then(async res => {
            const text = await res.text();
            if (!res.ok) throw new Error(`InOut.bot Error: ${text}`);
            return `InOut.bot sent to ${INOUT_PHONE}`;
        });
        results.push(promise);
    }

    if (results.length === 0) {
        // If we reached here without returning, it means no provider matched OR generic request with no config
        console.warn("Notification Skipped: No providers configured.");
        return NextResponse.json({ 
            error: "No notification providers configured", 
            details: "Please configure Telegram or Twilio in Admin Settings." 
        }, { status: 400 });
    }

    // Wait for all results
    const outcomes = await Promise.allSettled(results);
    
    // Log all outcomes for debugging
    outcomes.forEach((o, i) => {
        if (o.status === 'rejected') console.error(`Provider ${i} failed:`, o.reason);
    });

    const failed = outcomes.filter(r => r.status === 'rejected');
    const errors = failed.map(r => r.reason.message);

    if (failed.length > 0) {
        // If we tried multiple and at least one failed
        if (failed.length === results.length) {
             return NextResponse.json({ error: "Failed to notify", details: errors.join(", ") }, { status: 500 });
        }
        return NextResponse.json({ message: "Notification sent (partial failure)", errors }, { status: 200 });
    }

    return NextResponse.json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
