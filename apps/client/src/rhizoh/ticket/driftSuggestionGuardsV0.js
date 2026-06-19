/**
 * Drift Suggestion Guards V0 — DR-01 + DR-02 constitutional enforcement.
 *
 * DR-01: drift outputs are suggest-only (no mutation class).
 * DR-02: suggestions reference categories and deltas only — never specific
 *         CubeState mutations, users, or cube targets.
 * @see docs/RHIZOH_SECURITY_BOUNDARY_V1.md (DR-01, DR-02)
 */

export const INVARIANT_DR_01_LOOP_V0 = "DR_01_FEEDBACK_LOOP";
export const INVARIANT_DR_02_ISOLATION_V0 = "DR_02_SUGGESTION_ISOLATION";

/** Forbidden in suggestion / AlertPacket text (case-insensitive). */
const DR02_FORBIDDEN_PATTERNS_V0 = [
  /\buser\s+[a-z0-9:_-]+\s+should\b/i,
  /\bshould\s+be\s+blocked\b/i,
  /\bblock\s+user\b/i,
  /\bcube\s+rank\b/i,
  /\brank\s+should\b/i,
  /\bcubestate\b/i,
  /\bproposedmutation\b/i,
  /\bmutate_l[12]\b/i,
  /\bactorid\s*[:=]/i,
  /\bsubjectref\s*[:=]/i,
  /\bcubeid\s*[:=]/i,
  /\bticketid\s*[:=]\s*tkt_/i
];

/**
 * DR-01 — execution class must be suggest (or absent on read-only signals).
 * @param {object} output
 */
export function assertDriftSuggestionDr01V0(output) {
  if (output?.executionClass && output.executionClass !== "suggest") {
    return Object.freeze({
      ok: false,
      code: INVARIANT_DR_01_LOOP_V0,
      message: "DR-01: drift output must not request mutation"
    });
  }
  return Object.freeze({ ok: true });
}

/**
 * DR-02 — suggestion text must not reference specific mutations, users, or cubes.
 * @param {object} output
 */
export function assertDriftSuggestionDr02V0(output) {
  const text = String(output?.suggestion || output?.message || "").trim();
  if (!text) {
    return Object.freeze({ ok: true });
  }

  for (const pattern of DR02_FORBIDDEN_PATTERNS_V0) {
    if (pattern.test(text)) {
      return Object.freeze({
        ok: false,
        code: INVARIANT_DR_02_ISOLATION_V0,
        message: "DR-02: suggestion must reference categories and deltas only"
      });
    }
  }

  if (output?.targetUserId || output?.targetCubeId || output?.proposedMutation) {
    return Object.freeze({
      ok: false,
      code: INVARIANT_DR_02_ISOLATION_V0,
      message: "DR-02: AlertPacket must not carry user or cube mutation targets"
    });
  }

  return Object.freeze({ ok: true });
}

/**
 * Apply DR-01 + DR-02 guards; throws on violation.
 * @param {object} output
 */
export function assertDriftOutputGuardsV0(output) {
  const dr01 = assertDriftSuggestionDr01V0(output);
  if (!dr01.ok) throw new Error(dr01.message);
  const dr02 = assertDriftSuggestionDr02V0(output);
  if (!dr02.ok) throw new Error(dr02.message);
  return Object.freeze({ ok: true, dr01Enforced: true, dr02Enforced: true });
}
