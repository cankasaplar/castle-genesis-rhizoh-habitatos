import { initializeApp, getApps, getApp } from "firebase/app";

let parsed = null;
try {
  if (typeof __firebase_config !== "undefined" && __firebase_config) {
    parsed = JSON.parse(__firebase_config);
  }
} catch {
  parsed = null;
}

/** Web config gömülü ve geçerli mi (apiKey + projectId). */
export const firebaseConfigured = Boolean(
  parsed && typeof parsed === "object" && String(parsed.apiKey || "").length > 0 && String(parsed.projectId || "").length > 0
);

export function getFirebaseApp() {
  if (!firebaseConfigured) return null;
  if (getApps().length === 0) return initializeApp(parsed);
  return getApp();
}
