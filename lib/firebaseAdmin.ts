import admin from "firebase-admin";

// Initialize Firebase Admin SDK safely across hot reloads
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables.");
  }

  // Handle escaped newlines in private key
  privateKey = privateKey.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

// Compatibility exports for modules expecting function accessors
export function getAdminAuth() {
  return adminAuth;
}

export function getAdminDb() {
  return adminDb;
}
