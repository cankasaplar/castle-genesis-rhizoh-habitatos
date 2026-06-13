/**
 * Rhizoh Preference Store v0 — Ask Rhizoh routing + teacher preferences.
 */

export const RHIZOH_PREFERENCE_STORE_SCHEMA_V0 = "rhizoh.preference_store.v0";
export const RHIZOH_PREFERENCE_LS_KEY_V0 = "rhizoh_preference_store_v0";
export const RHIZOH_PREFERENCE_EVENT_V0 = "rhizoh:preference-store-v0";

export const RHIZOH_ASK_MODE_V0 = Object.freeze({
  RHIZOH_FIRST: "rhizoh_first",
  TEACHER_ONLY: "teacher_only"
});

const DEFAULTS = Object.freeze({
  schema: RHIZOH_PREFERENCE_STORE_SCHEMA_V0,
  askMode: RHIZOH_ASK_MODE_V0.RHIZOH_FIRST,
  localKnowledgeMinScore: 0.62,
  autoLearnFromTeachers: true,
  preferredTeachers: Object.freeze(["teacher_gpt", "teacher_claude", "teacher_gemini"]),
  updatedAt: null
});

function nowIso() {
  return new Date().toISOString();
}

function readRawV0() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(RHIZOH_PREFERENCE_LS_KEY_V0);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeRawV0(prefs) {
  if (typeof window === "undefined") return;
  const payload = { ...prefs, updatedAt: nowIso() };
  window.localStorage.setItem(RHIZOH_PREFERENCE_LS_KEY_V0, JSON.stringify(payload));
  try {
    window.dispatchEvent(new CustomEvent(RHIZOH_PREFERENCE_EVENT_V0, { detail: Object.freeze({ ...payload }) }));
  } catch {
    /* noop */
  }
}

export function readRhizohPreferencesV0() {
  return Object.freeze({ ...readRawV0() });
}

/**
 * @param {Partial<{ askMode: string, localKnowledgeMinScore: number, autoLearnFromTeachers: boolean, preferredTeachers: string[] }>} patch
 */
export function patchRhizohPreferencesV0(patch = {}) {
  const current = readRawV0();
  const next = Object.freeze({
    ...current,
    askMode: patch.askMode != null ? String(patch.askMode).slice(0, 32) : current.askMode,
    localKnowledgeMinScore:
      patch.localKnowledgeMinScore != null
        ? Math.max(0.4, Math.min(1, Number(patch.localKnowledgeMinScore) || 0.62))
        : current.localKnowledgeMinScore,
    autoLearnFromTeachers:
      patch.autoLearnFromTeachers != null
        ? patch.autoLearnFromTeachers === true
        : current.autoLearnFromTeachers,
    preferredTeachers:
      patch.preferredTeachers != null
        ? Object.freeze([...patch.preferredTeachers].map((t) => String(t).slice(0, 48)).slice(0, 8))
        : current.preferredTeachers,
    updatedAt: nowIso()
  });
  writeRawV0(next);
  return next;
}

export function resetRhizohPreferencesForTestV0() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(RHIZOH_PREFERENCE_LS_KEY_V0);
  }
}
