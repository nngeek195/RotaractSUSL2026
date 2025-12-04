import { NextResponse } from "next/server";
import { getAdminDb } from "../../../lib/firebaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();
    let { fullName, email, contact, faculty, department } = body;

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

    // Try fetching from Firestore Secure Settings (adminSettings/secure)
    try {
      const db = getAdminDb();
      const secureDoc = await db.collection("adminSettings").doc("secure").get();
      
      if (secureDoc.exists) {
        const data = secureDoc.data();
        if (data.telegramBotToken) TELEGRAM_BOT_TOKEN = data.telegramBotToken;
        if (data.telegramChatId) TELEGRAM_CHAT_ID = data.telegramChatId;
      }
    } catch (dbError) {
      console.warn("Failed to fetch admin settings from Firestore (using env vars fallback):", dbError.message);
    }
    
    // 2. Check if configured
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn("Notification Skipped: Telegram Bot Token or Chat ID not set.");
      return NextResponse.json({ message: "Skipped" }, { status: 200 });
    }

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

    // 4. Send Request to Telegram
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        })
    });
    
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Telegram API responded with ${res.status}: ${errText}`);
    }

    return NextResponse.json({ message: "Notification sent" });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Failed to notify" }, { status: 500 });
  }
}
