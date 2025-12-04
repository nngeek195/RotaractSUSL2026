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
    let ADMIN_PHONE = process.env.ADMIN_WHATSAPP_PHONE || "";
    let API_KEY = process.env.CALLMEBOT_API_KEY || "";

    // Try fetching from Firestore Settings first
    try {
      const db = getAdminDb();
      const settingsDoc = await db.collection("adminSettings").doc("general").get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        if (data.whatsappPhone) ADMIN_PHONE = data.whatsappPhone;
        if (data.callMeBotApiKey) API_KEY = data.callMeBotApiKey;
      }
    } catch (dbError) {
      console.warn("Failed to fetch admin settings from Firestore (using env vars fallback):", dbError.message);
    }
    
    // 2. Check if configured
    if (!ADMIN_PHONE || !API_KEY) {
      console.warn("WhatsApp Notification Skipped: WhatsApp Phone or API Key not set in Settings or Env.");
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

    // 4. Encode Message
    const encodedMessage = encodeURIComponent(message);

    // 5. Send Request
    // Using CallMeBot API (Simple/Free)
    const url = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${encodedMessage}&apikey=${API_KEY}`;
    
    const res = await fetch(url);
    
    if (!res.ok) {
        throw new Error(`WhatsApp API responded with ${res.status}`);
    }

    return NextResponse.json({ message: "Notification sent" });
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    return NextResponse.json({ error: "Failed to notify" }, { status: 500 });
  }
}
