import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let booted = false;
let db = null;

export function getFirebasePersistence() {
  if (!booted) {
    booted = true;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    if (projectId && clientEmail && privateKeyRaw) {
      try {
        const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
        if (getApps().length === 0) {
          initializeApp({
            credential: cert({ projectId, clientEmail, privateKey })
          });
        }
        db = getFirestore(getApp());
      } catch (e) {
        db = null;
        console.warn(
          "[GATEWAY] Firebase Admin init failed; falling back to file persistence:",
          String(e?.message || e)
        );
      }
    }
  }

  const requireFirebase = process.env.CASTLE_REQUIRE_FIREBASE_PERSIST === "true";
  if (requireFirebase && !db) {
    throw new Error("firebase_persistence_required_but_not_configured");
  }

  return {
    db,
    mode: db ? "firebase" : "file"
  };
}
