import { NextResponse } from "next/server";
import { getAdminDb } from "../../../../lib/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    let settings = {};

    // 1. Try fetching from the new public collection (reliefConfig)
    const publicDoc = await db.collection("reliefConfig").doc("website_settings").get();
    
    if (publicDoc.exists) {
      settings = publicDoc.data();
    } else {
      // 2. Fallback to the old restricted collection (adminSettings)
      // This works because we are server-side with Admin SDK (bypasses rules)
      const restrictedDoc = await db.collection("adminSettings").doc("general").get();
      if (restrictedDoc.exists) {
        settings = restrictedDoc.data();
      }
    }

    // Return only safe, public fields
    const publicSettings = {
      siteName: settings.siteName || "Rotaract Club of SUSL",
      contactEmail: settings.contactEmail || "info@rotaractsusl.org",
      whatsappPhone: settings.whatsappPhone || "",
      facebookUrl: settings.facebookUrl || "",
      instagramUrl: settings.instagramUrl || "",
      linkedinUrl: settings.linkedinUrl || "",
      tiktokUrl: settings.tiktokUrl || "",
      youtubeUrl: settings.youtubeUrl || "",
    };

    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
