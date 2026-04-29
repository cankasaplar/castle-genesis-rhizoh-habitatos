import jwt from "jsonwebtoken";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth as getFirebaseAdminAuth } from "firebase-admin/auth";

let firebaseReady = false;
let firebaseAuth = null;

function initFirebaseAdminIfConfigured() {
  if (firebaseReady) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    firebaseReady = true;
    return;
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    });
  }
  firebaseAuth = getFirebaseAdminAuth();
  firebaseReady = true;
}

function parseBearerHeader(value) {
  if (!value || typeof value !== "string") return "";
  if (!value.startsWith("Bearer ")) return "";
  return value.slice("Bearer ".length).trim();
}

export async function verifyClientToken(req) {
  const url = new URL(`ws://localhost${req.url || "/"}`);
  const tokenFromQuery = url.searchParams.get("auth") || "";
  const tokenFromHeader = parseBearerHeader(req.headers?.authorization || "");
  const token = tokenFromQuery || tokenFromHeader;
  if (!token) return { ok: false, reason: "Missing auth token." };

  initFirebaseAdminIfConfigured();

  // First: Firebase ID token verification if service account exists.
  if (firebaseAuth) {
    try {
      const decoded = await firebaseAuth.verifyIdToken(token, true);
      return { ok: true, kind: "firebase", user: { uid: decoded.uid, email: decoded.email || null } };
    } catch {
      // fall through to JWT
    }
  }

  // Fallback: signed JWT using shared secret.
  const jwtSecret = process.env.CASTLE_JWT_SECRET || "";
  if (!jwtSecret) return { ok: false, reason: "Token verification unavailable (missing firebase admin or CASTLE_JWT_SECRET)." };
  try {
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    return { ok: true, kind: "jwt", user: { uid: String(decoded.sub || decoded.uid || "unknown"), role: decoded.role || "user" } };
  } catch {
    return { ok: false, reason: "Invalid JWT token." };
  }
}
