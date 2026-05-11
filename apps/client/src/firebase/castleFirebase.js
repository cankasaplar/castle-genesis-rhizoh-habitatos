import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

let parsed = null;
try {
  if (typeof __firebase_config !== "undefined" && __firebase_config) {
    let step = JSON.parse(__firebase_config);
    if (typeof step === "string") step = JSON.parse(step);
    parsed = step;
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
  if (getApps().length === 0) {
    const app = initializeApp(parsed);
    try {
      initializeFirestore(app, {
        experimentalForceLongPolling: true,
        useFetchStreams: false
      });
    } catch (e) {
      const m = String(e?.message || e);
      if (!/already|started default/i.test(m)) {
        console.warn("[Castle] Firestore initializeFirestore:", m);
      }
    }
    return app;
  }
  return getApp();
}

/**
 * measurementId yapılandırılmışsa Analytics’i dinamik yükle (bundle/code-split).
 * Tarayıcı / GDPR gereksinimlerinize göre kullanıcı onayından sonra çağırabilirsiniz.
 */
export function initFirebaseAnalyticsWhenReady() {
  if (typeof window === "undefined" || !firebaseConfigured || !parsed?.measurementId) return;
  const app = getFirebaseApp();
  if (!app) return;
  import("firebase/analytics")
    .then(async ({ getAnalytics, isSupported }) => {
      try {
        if (!(await isSupported())) return;
        getAnalytics(app);
      } catch {
        /* Analytics desteklenmiyor */
      }
    })
    .catch(() => {});
}
