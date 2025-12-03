import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

// Ensure this route is always dynamic and not pre-rendered during build
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { uids } = await request.json();

    if (!uids || !Array.isArray(uids)) {
      return NextResponse.json(
        { error: "UIDs array is required" },
        { status: 400 }
      );
    }

    // Check verification status for each UID
    const verificationStatus = {};

    // adminAuth is initialized in lib/firebaseAdmin

    for (const uid of uids) {
      try {
        const userRecord = await adminAuth.getUser(uid);
        verificationStatus[uid] = userRecord.emailVerified;
      } catch (error) {
        console.error(`Error fetching user ${uid}:`, error);
        verificationStatus[uid] = false;
      }
    }

    return NextResponse.json({ verificationStatus });
  } catch (error) {
    console.error("Error checking verification:", error);
    return NextResponse.json(
      { error: "Failed to check verification status" },
      { status: 500 }
    );
  }
}
