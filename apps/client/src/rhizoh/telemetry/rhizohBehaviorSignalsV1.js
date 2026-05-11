/**
 * Minimal davranış sinyali katmanı — ağır analytics değil; DOM üzerinden gözlemlenebilir olaylar.
 * Dinleyici: `window.addEventListener("castle:rhizoh-signal", (e) => …)`
 */

export const RHIZOH_BEHAVIOR_SIGNAL_VERSION = "1.0.0";

export const CASTLE_RHIZOH_SIGNAL_EVENT = "castle:rhizoh-signal";

const LAST_VISIT_LS_KEY = "rhizoh.behavior.last_visit_ms";

/**
 * @param {string} name örn. rhizoh.phase.enter
 * @param {Record<string, unknown>} [payload]
 */
export function emitRhizohBehaviorSignal(name, payload = {}) {
  if (typeof window === "undefined") return;
  const detail = {
    schemaVersion: "1.0.0",
    signalVersion: RHIZOH_BEHAVIOR_SIGNAL_VERSION,
    name,
    ts: Date.now(),
    ...payload
  };
  try {
    window.dispatchEvent(new CustomEvent(CASTLE_RHIZOH_SIGNAL_EVENT, { detail }));
  } catch {
    /* noop */
  }
}

/**
 * İlk yüklemede önceki ziyaretten bu yana süreye göre dönüş sinyalleri (yerel, kimliksiz).
 */
export function recordRhizohVisitAndEmitReturnSignals() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  let last = 0;
  try {
    last = Math.floor(Number(window.localStorage.getItem(LAST_VISIT_LS_KEY)) || 0) || 0;
  } catch {
    last = 0;
  }
  if (last > 0) {
    const gapMs = Math.max(0, now - last);
    const day = 24 * 60 * 60 * 1000;
    if (gapMs >= day) {
      emitRhizohBehaviorSignal("rhizoh.session.return_24h", { gapMs });
    }
    if (gapMs >= 7 * day) {
      emitRhizohBehaviorSignal("rhizoh.session.return_7d", { gapMs });
    }
  }
  try {
    window.localStorage.setItem(LAST_VISIT_LS_KEY, String(now));
  } catch {
    /* noop */
  }
}

/**
 * Sohbet yoğunluğu özeti (mesafe değil — içerik + niyet sinyali).
 * @param {string} userText
 * @param {string} assistantText
 * @param {Record<string, unknown> | null | undefined} rhizohTrace
 * @param {number} turnIndexAfterAppend bu turdan sonra continuity tur sayısı
 */
export function buildRhizohTurnDepthSignal(userText, assistantText, rhizohTrace, turnIndexAfterAppend) {
  const u = String(userText || "").length;
  const a = String(assistantText || "").length;
  const intent = String(rhizohTrace?.router?.intent || "CHAT").slice(0, 32);
  const subIntent =
    rhizohTrace?.router?.subIntent != null ? String(rhizohTrace.router.subIntent).slice(0, 48) : "";
  const epistemicRich =
    rhizohTrace?.epistemic && typeof rhizohTrace.epistemic === "object" ? 1 : 0;
  const intentLift = intent !== "CHAT" ? 0.32 : 0;
  const lengthBand =
    Math.min(1, u / 380) * 0.42 + Math.min(1, a / 1100) * 0.38 + epistemicRich * 0.18;
  const depth01 = Math.min(1, Math.max(0, lengthBand + intentLift));
  return {
    userChars: u,
    assistantChars: a,
    intent,
    ...(subIntent ? { subIntent } : {}),
    turnIndex: Math.max(0, Math.floor(Number(turnIndexAfterAppend) || 0)),
    depth01: Math.round(depth01 * 1000) / 1000
  };
}
