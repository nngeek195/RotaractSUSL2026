import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

// Define the executive roles
const executiveRoles = [
  "President", "Vice-President", "Secretary", "Assistant Secretary",
  "Editor", "Assistant Treasurer", "Sgt. at Arms", "Club Service",
  "Community Service", "International Service", "Professional Development",
  "Finance", "Membership Development", "Public Relations", "Sports and Recreational Activities"
];

async function ensureRequesterIsPrivileged(req: Request): Promise<{ ok: boolean; uid?: string; email?: string }> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return { ok: false };
    const idToken = authHeader.substring("Bearer ".length);
    const decoded = await getAuth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = (decoded.email || "").toLowerCase().trim();

    // 1. Check admins collection by uid or email
    const adminDoc = await adminDb.collection("admins").doc(uid).get();
    if (adminDoc.exists) return { ok: true, uid, email };

    if (email) {
      const adminEmailDoc = await adminDb.collection("admins").doc(email).get();
      if (adminEmailDoc.exists) return { ok: true, uid, email };
    }

    // 2. Check executiveCommittee collection by uid or email
    const execDoc = await adminDb.collection("executiveCommittee").doc(uid).get();
    if (execDoc.exists) return { ok: true, uid, email };

    if (email) {
      const execEmailDoc = await adminDb.collection("executiveCommittee").doc(email).get();
      if (execEmailDoc.exists) return { ok: true, uid, email };
    }

    // 3. Fallback: check adminSettings secure doc for email list if present
    try {
      const secureDoc = await adminDb.collection("adminSettings").doc("secure").get();
      if (secureDoc.exists) {
        const secureData = secureDoc.data();
        const adminEmails = (secureData?.adminEmails || []).map((e: string) => e.toLowerCase().trim());
        if (email && adminEmails.includes(email)) {
          return { ok: true, uid, email };
        }
      }
    } catch {}

    return { ok: false };
  } catch (err) {
    console.error("Authentication check failed in update-role:", err);
    return { ok: false };
  }
}

export async function POST(req: Request) {
  try {
    const authCheck = await ensureRequesterIsPrivileged(req);
    if (!authCheck.ok) {
      return NextResponse.json({ error: "Unauthorized: Administrator or Committee privileges required" }, { status: 401 });
    }

    const body = await req.json();
    const { memberId, oldCollection, newPosition, imageUrl } = body as {
      memberId?: string;
      oldCollection?: "users" | "executiveCommittee";
      newPosition?: string;
      imageUrl?: string;
    };

    if (!memberId || !oldCollection || !newPosition) {
      return NextResponse.json({ error: "memberId, oldCollection, and newPosition are required" }, { status: 400 });
    }

    const isNewRoleExec = executiveRoles.includes(newPosition);
    const newCollection = isNewRoleExec ? "executiveCommittee" : "users";

    if (oldCollection === newCollection) {
      const updateData: Record<string, any> = { 
        position: newPosition,
        updatedAt: new Date()
      };
      if (newCollection === "executiveCommittee" && imageUrl !== undefined) {
        updateData.imageUrl = imageUrl;
      }

      await adminDb.collection(oldCollection).doc(memberId).set(updateData, { merge: true });
      return NextResponse.json({ ok: true, newCollection });
    } else {
      // Moving across collections
      const oldDocSnap = await adminDb.collection(oldCollection).doc(memberId).get();
      const existingData = oldDocSnap.exists ? oldDocSnap.data() || {} : {};

      const dataToSave: Record<string, any> = {
        ...existingData,
        position: newPosition,
        updatedAt: new Date()
      };

      if (newCollection === "executiveCommittee") {
        if (imageUrl !== undefined) {
          dataToSave.imageUrl = imageUrl;
        }
      } else {
        delete dataToSave.imageUrl;
      }

      // Write to new collection then remove from old collection
      await adminDb.collection(newCollection).doc(memberId).set(dataToSave);
      await adminDb.collection(oldCollection).doc(memberId).delete();

      return NextResponse.json({ ok: true, newCollection });
    }
  } catch (error: any) {
    console.error("Update role error:", error);
    return NextResponse.json({ error: error.message || "Internal error updating role" }, { status: 500 });
  }
}
