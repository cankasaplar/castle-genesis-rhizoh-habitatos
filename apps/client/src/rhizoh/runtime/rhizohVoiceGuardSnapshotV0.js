/**
 * Guard snapshot — boolean decisions only; NOT a runtime execution chain.
 * Used on SLOW path eligibility check after pipeline decision.
 */

import { evaluateSttContaminationV0 } from "./voiceSttContaminationGuardV0.js";
import { validateMicIntentProvenanceV0 } from "./rhizohInputProvenanceV0.js";
import { VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";

export const RHIZOH_VOICE_GUARD_SNAPSHOT_SCHEMA_V0 = "castle.rhizoh.voice_guard_snapshot.v0";

/**
 * @param {string} text
 * @param {{
 *   confidence?: number,
 *   strategy?: string,
 *   band?: string,
 *   provenance?: object
 * }} [opts]
 */
export function evaluateSlowPathGuardSnapshotV0(text, opts = {}) {
  const t = String(text || "").trim();
  /** @type {string[]} */
  const flags = [];

  if (!t) {
    return Object.freeze({
      schema: RHIZOH_VOICE_GUARD_SNAPSHOT_SCHEMA_V0,
      allowSlow: false,
      reason: "empty_text",
      flags: Object.freeze(["empty"])
    });
  }

  if (opts.provenance) {
    const prov = validateMicIntentProvenanceV0(opts.provenance);
    if (!prov.ok) {
      flags.push("provenance_reject");
      return Object.freeze({
        schema: RHIZOH_VOICE_GUARD_SNAPSHOT_SCHEMA_V0,
        allowSlow: false,
        reason: prov.error || "provenance_reject",
        flags: Object.freeze(flags)
      });
    }
  }

  const contamination = evaluateSttContaminationV0(t, { strategy: opts.strategy });
  if (contamination.contaminated) {
    flags.push(contamination.reason || "contamination");
    return Object.freeze({
      schema: RHIZOH_VOICE_GUARD_SNAPSHOT_SCHEMA_V0,
      allowSlow: false,
      reason: contamination.reason || "platform_template_leak",
      flags: Object.freeze(flags),
      contamination
    });
  }

  const conf = Number(opts.confidence);
  if (Number.isFinite(conf) && conf < VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3) {
    flags.push("low_confidence");
  }

  return Object.freeze({
    schema: RHIZOH_VOICE_GUARD_SNAPSHOT_SCHEMA_V0,
    allowSlow: true,
    reason: "slow_guard_ok",
    flags: Object.freeze(flags),
    confidence: Number.isFinite(conf) ? conf : undefined
  });
}
