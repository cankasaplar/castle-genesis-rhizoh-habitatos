/**
 * Rhizoh Learning Core boot v0 — preferences, knowledge seed from castle memory.
 */

import { listCastleChronicleV0 } from "./castleChronicleV0.js";
import { readCastleIdentityV0 } from "./castleIdentityV0.js";
import { readRhizohPreferencesV0 } from "./rhizohPreferenceStoreV0.js";
import { seedRhizohLocalKnowledgeV0 } from "./rhizohTeacherIngestV0.js";

let bootedV0 = false;

/**
 * @param {{ userId?: string }} [opts]
 */
export function bootRhizohLearningCoreV0(opts = {}) {
  const userId = String(opts.userId || "").trim();
  if (!userId || bootedV0) {
    return Object.freeze({
      booted: bootedV0,
      prefs: readRhizohPreferencesV0()
    });
  }
  bootedV0 = true;

  const identity = readCastleIdentityV0();
  const chronicle = listCastleChronicleV0({ limit: 8 });
  seedRhizohLocalKnowledgeV0({
    castleId: identity?.castleId || userId,
    motto: identity?.motto,
    chronicleTitles: chronicle.map((c) => c.title).slice(0, 5)
  });

  return Object.freeze({
    booted: true,
    prefs: readRhizohPreferencesV0(),
    knowledgeSeeded: true
  });
}

export function resetRhizohLearningCoreBootForTestV0() {
  bootedV0 = false;
}
