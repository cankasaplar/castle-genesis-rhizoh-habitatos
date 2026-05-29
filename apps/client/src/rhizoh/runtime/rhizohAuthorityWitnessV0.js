/**
 * Rhizoh Shadow Witness v0 — opt-in observability only (§14 RHIZOH_GOVERNANCE_MIDDLEWARE_V1).
 * Does not branch on decisions; does not mutate runtime. Flag off → zero work.
 */

import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";
import { rhizohConversationRecorderAppendWitnessV0 } from "./rhizohConversationRecorderV0.js";

const FLAG = "VITE_RHIZOH_AUTHORITY_WITNESS_DEBUG";

/**
 * @param {Record<string, unknown>} record
 */
export function witnessRhizohAuthorityV0(record) {
  if (!isCastleDebugGranularFlagEnabled(FLAG)) return;
  const ts = Date.now();
  const payload = { ...record, ts, schemaVersion: "rhizoh.authority_witness.v0" };
  try {
    // eslint-disable-next-line no-console -- intentional shadow trace (debug-gated)
    console.debug("[rhizoh.authority.witness]", payload);
    rhizohConversationRecorderAppendWitnessV0(payload);
  } catch {
    /* noop */
  }
}
