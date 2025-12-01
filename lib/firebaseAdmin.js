import admin from "firebase-admin";

function ensureInitialized() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // Only attempt init if required envs are present
  if (!projectId || !clientEmail || !privateKey) {
    // Defer throwing until a consumer actually requests a service
    throw new Error(
      "Firebase Admin not configured. Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getAdminAuth() {
  ensureInitialized();
  return admin.auth();
}

export function getAdminDb() {
  ensureInitialized();
  return admin.firestore();
}
