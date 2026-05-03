/**
 * Presence Detection — "bir şey burada"; kimlik yok.
 */

/** @typedef {"voice"|"text"|"cursor"|"avatar"|"agent_event"|"sensor"|"mic_activity"} PresenceModality */

/**
 * @typedef {{
 *   micActive: boolean,
 *   tabFocused: boolean,
 *   windowFocused: boolean,
 *   pointerVelocity: number,
 *   pointerBurst: boolean,
 *   lastPointerAt: number,
 *   lastSampleAt: number
 * }} BrowserPresenceRef
 */

/**
 * @param {{
 *   message?: string,
 *   micActive?: boolean,
 *   voiceActivity?: boolean,
 *   cursorActivity?: boolean,
 *   avatarActivity?: boolean,
 *   agentEvent?: unknown,
 *   sensorEvent?: unknown,
 *   tabFocused?: boolean,
 *   windowFocused?: boolean,
 *   pointerVelocity?: number
 * }} signals
 * @param {{ seq?: number }} [ctx]
 */
export function detectPresence(signals, ctx = {}) {
  const s = signals && typeof signals === "object" ? signals : {};
  /** @type {PresenceModality[]} */
  const modality = [];
  if (String(s.message || "").trim().length > 0) modality.push("text");
  if (s.micActive) modality.push("mic_activity");
  if (s.voiceActivity) modality.push("voice");
  if (s.cursorActivity) modality.push("cursor");
  if (s.avatarActivity) modality.push("avatar");
  if (s.agentEvent != null && s.agentEvent !== false) modality.push("agent_event");
  if (s.sensorEvent != null && s.sensorEvent !== false) modality.push("sensor");
  if (s.tabFocused === false || s.windowFocused === false) {
    if (!modality.includes("sensor")) modality.push("sensor");
  }

  const n = modality.length;
  let confidence = 0.18;
  if (n > 0) confidence += Math.min(0.55, n * 0.12);
  if (modality.includes("text")) confidence += 0.08;
  if (modality.includes("cursor")) confidence += 0.04;
  if (modality.includes("mic_activity")) confidence += 0.05;
  const pv = Number(s.pointerVelocity) || 0;
  if (pv > 1.5) confidence += 0.04;
  confidence = Math.min(0.95, confidence);

  const seq = Number(ctx.seq) >= 0 ? Number(ctx.seq) : 0;
  return {
    id: `presence_${seq + 1}`,
    detectedAt: Date.now(),
    modality,
    confidence: Math.round(confidence * 1000) / 1000,
    sensorSummary: {
      tabFocused: s.tabFocused !== false,
      windowFocused: s.windowFocused !== false,
      pointerVelocity: Math.round(pv * 1000) / 1000
    }
  };
}
