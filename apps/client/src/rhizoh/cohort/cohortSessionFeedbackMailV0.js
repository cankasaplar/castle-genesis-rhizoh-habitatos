/**
 * Session-end feedback mail — cohort review only; fires once on pagehide.
 */

import { getAuth } from "firebase/auth";
import { getFirebaseApp, firebaseConfigured } from "../../firebase/castleFirebase.js";
import { getActiveCohortReviewerFromUrlV0, isCohortReviewSessionV0 } from "./cohortInvitePackV0.js";
import { buildCohortFeedbackUrlV0, ensureCohortSessionRefV0 } from "./cohortFeedbackUrlV0.js";

const SENT_KEY = "rhizoh.cohort.feedback_mail_sent.v0";

function getAuthInstanceV0() {
  if (!firebaseConfigured) return null;
  try {
    return getAuth(getFirebaseApp());
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<string | null>}
 */
async function resolveFirebaseIdTokenV0() {
  try {
    const auth = getAuthInstanceV0();
    const user = auth?.currentUser;
    if (!user?.getIdToken) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * @returns {string | null}
 */
function resolveObserverEmailV0() {
  try {
    const auth = getAuthInstanceV0();
    const email = auth?.currentUser?.email;
    return email ? String(email).trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

function feedbackMailAlreadySentV0(sessionRef) {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(SENT_KEY) === sessionRef;
  } catch {
    return false;
  }
}

function markFeedbackMailSentV0(sessionRef) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SENT_KEY, sessionRef);
  } catch {
    /* noop */
  }
}

/**
 * @param {{ reviewerId?: string, sessionRef?: string, email?: string | null }} [opts]
 */
export async function requestCohortSessionFeedbackMailV0(opts = {}) {
  if (!isCohortReviewSessionV0()) return { ok: false, reason: "not_cohort_review" };

  const reviewerId = String(opts.reviewerId || getActiveCohortReviewerFromUrlV0() || "metehan").trim().toLowerCase();
  const sessionRef = String(opts.sessionRef || ensureCohortSessionRefV0()).trim();
  if (feedbackMailAlreadySentV0(sessionRef)) return { ok: true, reason: "already_sent" };

  const email = opts.email ?? resolveObserverEmailV0();
  const token = await resolveFirebaseIdTokenV0();
  const feedbackUrl = buildCohortFeedbackUrlV0({ reviewerId, sessionRef });

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch("/api/cohortSessionFeedbackMailV0", {
      method: "POST",
      headers,
      body: JSON.stringify({
        schema: "castle.rhizoh.cohort_session_feedback_mail.v0",
        reviewerId,
        sessionRef,
        feedbackUrl,
        email
      }),
      keepalive: true
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json?.ok) {
      markFeedbackMailSentV0(sessionRef);
      return { ok: true, feedbackUrl };
    }
    return { ok: false, reason: json?.reason || `http_${res.status}` };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
}

export function installCohortSessionFeedbackMailV0() {
  if (typeof window === "undefined") return () => {};
  ensureCohortSessionRefV0();

  const onLeave = () => {
    void requestCohortSessionFeedbackMailV0();
  };
  window.addEventListener("pagehide", onLeave);
  return () => window.removeEventListener("pagehide", onLeave);
}
