/**
 * LLM çıktısını QPP veya düz metne çevirir.
 */

import { deriveCognitiveTraceLabel } from "./deriveCognitiveTraceLabel.js";
import { RHIZOH_INTENT } from "../router/intentTypes.js";

/** @param {number} x */
function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

/**
 * @param {Record<string, unknown> | null | undefined} router
 * @param {Record<string, unknown> | null | undefined} emotions
 */
export function derivePresenceIntensity(router, emotions) {
  let v = 0.42;
  if (emotions && typeof emotions === "object") {
    v += (Number(emotions.tension) || 0) * 0.14 + (Number(emotions.care) || 0) * 0.07;
  }
  if (String(router?.intent || "").toUpperCase() === RHIZOH_INTENT.CRISIS) v += 0.12;
  if (Number(router?.urgency) > 0.65) v += 0.06;
  return clamp01(v);
}

/** @param {Record<string, unknown> | null | undefined} router */
export function derivePresenceDuration(router) {
  const i = String(router?.intent || "").toUpperCase();
  if (i === RHIZOH_INTENT.REFLECT) return 16_000;
  if (i === RHIZOH_INTENT.CRISIS) return 8_000;
  if (i === RHIZOH_INTENT.SILENCE) return 14_000;
  return 12_000;
}

/** @param {Record<string, unknown> | null | undefined} router */
export function derivePulsePattern(router) {
  if (Number(router?.urgency) > 0.72) return "urgent_triple";
  return "receive_absorb_settle";
}

/**
 * @param {string} raw
 */
function parseSilenceDirective(raw) {
  const text = String(raw || "");
  if (!/<SILENCE\b/i.test(text)) {
    return { active: false, stripped: text, attrs: null };
  }
  const attrsMatch = /<SILENCE([^>]*)>/i.exec(text);
  const attrs = attrsMatch ? attrsMatch[1] || "" : "";
  const intensityM = /intensity\s*=\s*["']?([\d.]+)/i.exec(attrs);
  const resonanceM = /resonance\s*=\s*["']?([\d.]+)/i.exec(attrs);
  const durationM = /durationMs\s*=\s*["']?(\d+)/i.exec(attrs);
  const stateM = /state\s*=\s*["']?(\w+)/i.exec(attrs);
  const stripped = text.replace(/<SILENCE[^>]*\/?>/gi, "").trim();
  return {
    active: true,
    stripped: stripped || "—",
    attrs: {
      intensity: intensityM ? clamp01(parseFloat(intensityM[1])) : null,
      resonance: resonanceM ? clamp01(parseFloat(resonanceM[1])) : null,
      durationMs: durationM ? Math.min(180_000, Math.max(2_000, parseInt(durationM[1], 10))) : null,
      state: stateM ? String(stateM[1]).toLowerCase() : null
    }
  };
}

/**
 * @param {{
 *   reply: string,
 *   router?: Record<string, unknown> | null,
 *   resonance?: number | null,
 *   emotions?: Record<string, unknown> | null,
 *   policy?: { silenceCapable?: boolean } | null,
 *   gatewayPhase?: string | null
 * }} input
 * @returns {{ type: "QPP_STATE", payload: { mode: string, presence: Record<string, unknown> } } | { type: "TEXT", payload: string }}
 */
export function normalizeRhizohOutput(input = {}) {
  const reply = String(input.reply ?? "");
  const text = reply.trim();
  const router = input.router && typeof input.router === "object" ? input.router : null;
  const policy = input.policy && typeof input.policy === "object" ? input.policy : null;
  const silenceOk = policy?.silenceCapable !== false;
  const gatewayPhase = input.gatewayPhase != null ? String(input.gatewayPhase) : "";
  const labelBase = deriveCognitiveTraceLabel(router?.intent, gatewayPhase);
  const resonanceIn =
    input.resonance != null && Number.isFinite(Number(input.resonance)) ? clamp01(Number(input.resonance)) : null;

  const parsed = parseSilenceDirective(reply);
  if (parsed.active && silenceOk) {
    const inten = parsed.attrs?.intensity ?? derivePresenceIntensity(router, input.emotions);
    const res = parsed.attrs?.resonance ?? resonanceIn ?? 0.71;
    const dur = parsed.attrs?.durationMs ?? derivePresenceDuration(router);
    const stateLabel = parsed.attrs?.state || labelBase;
    return {
      type: "QPP_STATE",
      payload: {
        mode: "presence",
        presence: {
          state: stateLabel,
          intensity: inten,
          resonance: res,
          durationMs: dur,
          pulsePattern: derivePulsePattern(router)
        }
      }
    };
  }

  if (text === "<SILENCE>" && silenceOk) {
    return {
      type: "QPP_STATE",
      payload: {
        mode: "presence",
        presence: {
          state: labelBase,
          intensity: derivePresenceIntensity(router, input.emotions),
          resonance: resonanceIn ?? 0.5,
          durationMs: derivePresenceDuration(router),
          pulsePattern: derivePulsePattern(router)
        }
      }
    };
  }

  if (!text && String(router?.intent || "").toUpperCase() === RHIZOH_INTENT.SILENCE && silenceOk) {
    return {
      type: "QPP_STATE",
      payload: {
        mode: "presence",
        presence: {
          state: labelBase,
          intensity: derivePresenceIntensity(router, input.emotions),
          resonance: resonanceIn ?? 0.65,
          durationMs: derivePresenceDuration(router),
          pulsePattern: derivePulsePattern(router)
        }
      }
    };
  }

  return { type: "TEXT", payload: text || reply };
}

/**
 * CommsPanel uyumu: normalize + gateway → UI / TTS bayrakları.
 * @param {ReturnType<typeof normalizeRhizohOutput>} norm
 * @param {string} [rawReply]
 */
export function materializeCommsFromNormalized(norm, rawReply = "") {
  if (norm.type === "QPP_STATE") {
    const pr = norm.payload.presence;
    return {
      uiReply: String(rawReply || "")
        .replace(/<SILENCE[^>]*\/?>/gi, "")
        .trim() || "—",
      skipSpeech: true,
      quietSpec: {
        mode: "presence",
        presence: pr,
        trace: typeof pr.state === "string" ? pr.state : "listening"
      },
      qppPayload: norm.payload
    };
  }
  return {
    uiReply: norm.payload,
    skipSpeech: false,
    quietSpec: null,
    qppPayload: null
  };
}
