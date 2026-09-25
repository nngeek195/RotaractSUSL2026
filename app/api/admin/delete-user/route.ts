import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

// Verify requester is privileged (admin or committee) via ID token in Authorization header
async function ensureRequesterIsAdmin(req: Request): Promise<boolean> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const idToken = authHeader.substring("Bearer ".length);
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = (decoded.email || "").toLowerCase().trim();

    // Check admins collection by uid or email
    const adminDoc = await adminDb.collection("admins").doc(uid).get();
    if (adminDoc.exists) return true;

    if (email) {
      const adminEmailDoc = await adminDb.collection("admins").doc(email).get();
      if (adminEmailDoc.exists) return true;
    }

    // Check executiveCommittee collection by uid or email
    const execDoc = await adminDb.collection("executiveCommittee").doc(uid).get();
    if (execDoc.exists) return true;

    if (email) {
      const execEmailDoc = await adminDb.collection("executiveCommittee").doc(email).get();
      if (execEmailDoc.exists) return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const isAdmin = await ensureRequesterIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { uid } = body as { uid?: string };
    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    // Delete from Firebase Authentication
    await adminAuth.deleteUser(uid);

    // Delete relevant Firestore documents
    const paths = ["pendingRequests", "users", "executiveCommittee"];
    for (const col of paths) {
      const docRef = adminDb.collection(col).doc(uid);
      const snap = await docRef.get();
      if (snap.exists) await docRef.delete();
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
