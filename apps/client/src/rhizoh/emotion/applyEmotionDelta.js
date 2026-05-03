import { normalizeEmotionState } from "./emotionState.js";
import { decayEmotionsForElapsedMs } from "./emotionDecay.js";
import { RHIZOH_INTENT } from "../router/intentTypes.js";
import { RHIZOH_EMOTIONAL_SIGNAL } from "../router/intentSignals.js";

/**
 * @param {unknown[]} recentReality
 */
function recentFailureNudge(recentReality) {
  const rr = Array.isArray(recentReality) ? recentReality : [];
  if (!rr.some((line) => /fail|hata|error|crash|çök|bozuk/i.test(String(line || "")))) {
    return { tension: 0, rupture: 0 };
  }
  return { tension: 0.05, rupture: 0.02 };
}

/**
 * @param {number | null | undefined} lastUpdatedAt
 */
function inactivityNudge(lastUpdatedAt) {
  if (lastUpdatedAt == null || !Number.isFinite(Number(lastUpdatedAt))) return { familiarity: 0, care: 0 };
  const gap = Date.now() - Number(lastUpdatedAt);
  if (gap < 1_800_000) return { familiarity: 0, care: 0 };
  return { familiarity: 0.02, care: 0.03 };
}

/**
 * Router + oturum sinyalleri → güncel duygu durumu (LLM öncesi).
 *
 * @param {{
 *   current: Record<string, unknown>,
 *   routerOutput: { intent?: string, emotionalSignal?: string, urgency?: number },
 *   runtime?: Record<string, unknown>,
 *   continuity?: Record<string, unknown>,
 *   lastUpdatedAt?: number | null
 * }} input
 */
export function applyEmotionDelta({ current, routerOutput, runtime = {}, continuity = {}, lastUpdatedAt }) {
  let next = normalizeEmotionState(current);
  const at = lastUpdatedAt != null && lastUpdatedAt !== "" ? Number(lastUpdatedAt) : NaN;
  if (Number.isFinite(at)) {
    next = decayEmotionsForElapsedMs(next, Date.now() - at);
  }

  const intent = String(routerOutput?.intent || "");
  const emotionalSignal = String(routerOutput?.emotionalSignal || "");
  const urgency = Math.min(1, Math.max(0, Number(routerOutput?.urgency) || 0));

  if (intent === RHIZOH_INTENT.CRISIS) {
    next.tension += 0.2 + urgency * 0.08;
    next.care += 0.1;
    next.wonder -= 0.1;
    next.rupture += 0.04;
  } else if (intent === RHIZOH_INTENT.BUILD || intent === RHIZOH_INTENT.PLAY) {
    next.wonder += 0.08;
    next.tension -= 0.1;
    next.trust += 0.02;
  } else if (intent === RHIZOH_INTENT.REFLECT) {
    next.trust += 0.05;
    next.wonder += 0.05;
    next.tension -= 0.05;
  } else if (intent === RHIZOH_INTENT.CHAT) {
    next.familiarity += 0.03;
    next.trust += 0.01;
  } else if (intent === RHIZOH_INTENT.SILENCE) {
    next.tension -= 0.03;
    next.care += 0.02;
  }

  if (emotionalSignal === RHIZOH_EMOTIONAL_SIGNAL.FATIGUED_BUT_DETERMINED) {
    next.care += 0.15;
    next.tension += 0.05;
  } else if (emotionalSignal === RHIZOH_EMOTIONAL_SIGNAL.ALERT) {
    next.tension += 0.1;
  } else if (emotionalSignal === RHIZOH_EMOTIONAL_SIGNAL.FOCUSED) {
    next.tension -= 0.05;
    next.wonder += 0.05;
  } else if (emotionalSignal === RHIZOH_EMOTIONAL_SIGNAL.WARM) {
    next.trust += 0.04;
    next.tension -= 0.04;
  } else if (emotionalSignal === RHIZOH_EMOTIONAL_SIGNAL.FRUSTRATED) {
    next.tension += 0.08;
    next.rupture += 0.05;
  } else if (emotionalSignal === RHIZOH_EMOTIONAL_SIGNAL.CONTEMPLATIVE) {
    next.wonder += 0.03;
    next.tension -= 0.02;
  }

  const rr = continuity?.recentReality;
  const fail = recentFailureNudge(rr);
  next.tension += fail.tension;
  next.rupture += fail.rupture;

  const inact = inactivityNudge(Number.isFinite(at) ? at : undefined);
  next.familiarity += inact.familiarity;
  next.care += inact.care;

  const gov = runtime?.governanceState;
  if (gov && typeof gov === "string" && /stress|degraded|hold/i.test(gov)) {
    next.tension += 0.04;
  }

  const hi = runtime?.rhizohHealthInfluence;
  if (hi && typeof hi === "object") {
    next.trust += Number(hi.trustDelta) || 0;
    next.tension += Number(hi.tensionDelta) || 0;
    next.wonder += Number(hi.wonderDelta) || 0;
    next.care += Number(hi.careDelta) || 0;
    next.rupture += Number(hi.ruptureDelta) || 0;
    next.repair += Number(hi.repairDelta) || 0;
    next.familiarity += Number(hi.familiarityDelta) || 0;
  } else {
    const gw = runtime?.gatewayPhase ?? runtime?.rhizohGatewayPhase;
    if (gw && String(gw).match(/degraded|offline|offline_dns|maintenance|error/i)) {
      next.tension += 0.06;
      next.care += 0.04;
    }
  }

  return normalizeEmotionState(next);
}
