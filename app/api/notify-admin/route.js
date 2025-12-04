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
    
    // Twilio Config
    let TWILIO_SID = "";
    let TWILIO_TOKEN = "";
    let TWILIO_FROM = "";
    let TWILIO_TO = "";

    // Try fetching from Firestore Secure Settings (adminSettings/secure)
    try {
      const db = getAdminDb();
      const secureDoc = await db.collection("adminSettings").doc("secure").get();
      
      if (secureDoc.exists) {
        const data = secureDoc.data();
        if (data.telegramBotToken) TELEGRAM_BOT_TOKEN = data.telegramBotToken;
        if (data.telegramChatId) TELEGRAM_CHAT_ID = data.telegramChatId;
        
        if (data.twilioAccountSid) TWILIO_SID = data.twilioAccountSid;
        if (data.twilioAuthToken) TWILIO_TOKEN = data.twilioAuthToken;
        if (data.twilioFromPhone) TWILIO_FROM = data.twilioFromPhone;
        if (data.twilioToPhone) TWILIO_TO = data.twilioToPhone;
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
📱 *Contact:* ${contact}
🎓 *Faculty:* ${faculty}
🏫 *Dept:* ${department || "N/A"}

_Please check the Admin Dashboard to approve/reject._
    `.trim();

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

    // --- 2. Twilio Notification (WhatsApp) ---
    if ((!provider || provider === 'twilio') && TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && TWILIO_TO) {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
        const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
        
        // Ensure numbers are formatted for WhatsApp
        const fromNumber = TWILIO_FROM.startsWith('whatsapp:') ? TWILIO_FROM : `whatsapp:${TWILIO_FROM}`;
        const toNumber = TWILIO_TO.startsWith('whatsapp:') ? TWILIO_TO : `whatsapp:${TWILIO_TO}`;

        const formData = new URLSearchParams();
        formData.append('From', fromNumber);
        formData.append('To', toNumber);
        formData.append('Body', message); // WhatsApp supports Markdown

        const promise = fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        }).then(async res => {
            if (!res.ok) throw new Error(`Twilio WhatsApp Error: ${await res.text()}`);
            return "Twilio WhatsApp sent";
        });
        results.push(promise);
    }

    if (results.length === 0) {
        console.warn("Notification Skipped: No providers configured.");
        return NextResponse.json({ message: "Skipped - No Config" }, { status: 200 });
    }

    // Wait for all results
    const outcomes = await Promise.allSettled(results);
    const errors = outcomes.filter(r => r.status === 'rejected').map(r => r.reason.message);

    if (errors.length > 0) {
        console.error("Notification Errors:", errors);
        // Only fail if ALL failed
        if (!outcomes.some(r => r.status === 'fulfilled')) {
            return NextResponse.json({ error: "Failed to notify", details: errors }, { status: 500 });
        }
        // Partial success is still success for the client
        return NextResponse.json({ message: "Notification sent (partial success)", errors });
    }

    return NextResponse.json({ message: "Notification sent" });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Failed to notify" }, { status: 500 });
  }
}
