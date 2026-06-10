/**
 * FOX_PROACTIVE_DEPLOYMENT_GATE_V1 — first-contact phase env (no adaptation imports).
 */

import {
  getRhizohCohortIdForRequestV0,
  writeRhizohCohortIdDevV0
} from "./rhizohCohortPinClientV0.js";

export const FOX_FIRST_CONTACT_PHASE_V1 = Object.freeze({
  OFF: "off",
  PHASE_0_SELF: "phase_0_self",
  PHASE_1_COHORT: "phase_1_cohort"
});

export const FOX_FIRST_CONTACT_COHORT_V1 = Object.freeze([
  Object.freeze({
    id: "rhizoh_primary_tester_01",
    role: "anchor_user",
    mode: "full_observation",
    feedbackWeight: 1.0
  })
]);

const LS_ANCHOR_USER_V1 = "rhizoh.fox_first_contact.anchor_user.v1";
const LS_PHASE_OVERRIDE_V1 = "rhizoh.fox_first_contact.phase_override.v1";
const PRIMARY_COHORT_ID_V1 = FOX_FIRST_CONTACT_COHORT_V1[0].id;
const PHASE_1_HARD_CAP_PER_HOUR_V1 = 1;
const LOW_BUDGET_COOLDOWN_MIN_V1 = 30;

function bootstrapFoxFirstContactFromUrlV1() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  if (window.__rhizoh.foxFirstContactUrlBootstrapped) return;
  window.__rhizoh.foxFirstContactUrlBootstrapped = true;

  try {
    const params = new URLSearchParams(window.location.search);
    const cohort = String(params.get("cohort") || "").trim();
    if (cohort === PRIMARY_COHORT_ID_V1) {
      writeRhizohCohortIdDevV0(cohort);
      pinFoxFirstContactAnchorUserV1(true);
    }

    const foxPhase = String(params.get("fox_phase") || params.get("fox") || "")
      .trim()
      .toLowerCase();
    if (foxPhase === "0" || foxPhase === "observe" || foxPhase === "self" || foxPhase === "phase_0") {
      sessionStorage.setItem(LS_PHASE_OVERRIDE_V1, FOX_FIRST_CONTACT_PHASE_V1.PHASE_0_SELF);
    } else if (
      foxPhase === "1" ||
      foxPhase === "cohort" ||
      foxPhase === "active" ||
      foxPhase === "phase_1"
    ) {
      sessionStorage.removeItem(LS_PHASE_OVERRIDE_V1);
    }
  } catch {
    /* noop */
  }
}

function readFirstContactPhaseOverrideV1() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LS_PHASE_OVERRIDE_V1);
    if (raw === FOX_FIRST_CONTACT_PHASE_V1.PHASE_0_SELF) {
      return FOX_FIRST_CONTACT_PHASE_V1.PHASE_0_SELF;
    }
  } catch {
    /* noop */
  }
  return null;
}

function readFirstContactPhaseEnvV1() {
  bootstrapFoxFirstContactFromUrlV1();
  const override = readFirstContactPhaseOverrideV1();
  if (override) return override;

  const raw = String(import.meta.env?.VITE_FOX_FIRST_CONTACT_PHASE ?? "")
    .trim()
    .toLowerCase();
  if (raw === "0" || raw === "phase_0" || raw === "observe" || raw === "self") {
    return FOX_FIRST_CONTACT_PHASE_V1.PHASE_0_SELF;
  }
  if (raw === "1" || raw === "phase_1" || raw === "cohort" || raw === "active") {
    return FOX_FIRST_CONTACT_PHASE_V1.PHASE_1_COHORT;
  }
  return FOX_FIRST_CONTACT_PHASE_V1.OFF;
}

function isFirstContactForceEnabledV1() {
  const raw = String(import.meta.env?.VITE_FOX_FIRST_CONTACT_FORCE ?? "")
    .trim()
    .toLowerCase();
  return raw === "1" || raw === "true";
}

export function isFoxFirstContactAnchorUserV1() {
  const cohortId = getRhizohCohortIdForRequestV0();
  if (cohortId === PRIMARY_COHORT_ID_V1) return true;

  const envTester = String(import.meta.env?.VITE_FOX_FIRST_CONTACT_TESTER_ID ?? "").trim();
  if (envTester === PRIMARY_COHORT_ID_V1) return true;

  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(LS_ANCHOR_USER_V1) === "1";
  } catch {
    return false;
  }
}

export function pinFoxFirstContactAnchorUserV1(pinned = true) {
  if (typeof localStorage === "undefined") return;
  try {
    if (pinned) localStorage.setItem(LS_ANCHOR_USER_V1, "1");
    else localStorage.removeItem(LS_ANCHOR_USER_V1);
  } catch {
    /* noop */
  }
}

export function resolveFoxFirstContactDeploymentV1() {
  const phase = readFirstContactPhaseEnvV1();
  const anchorUser = isFoxFirstContactAnchorUserV1();
  const cohortMember = FOX_FIRST_CONTACT_COHORT_V1[0];

  let active = false;
  let effectivePhase = FOX_FIRST_CONTACT_PHASE_V1.OFF;

  if (phase === FOX_FIRST_CONTACT_PHASE_V1.PHASE_0_SELF) {
    active = true;
    effectivePhase = FOX_FIRST_CONTACT_PHASE_V1.PHASE_0_SELF;
  } else if (phase === FOX_FIRST_CONTACT_PHASE_V1.PHASE_1_COHORT) {
    if (anchorUser || isFirstContactForceEnabledV1()) {
      active = true;
      effectivePhase = FOX_FIRST_CONTACT_PHASE_V1.PHASE_1_COHORT;
    }
  }

  const calibrationPersistWrite =
    active && effectivePhase === FOX_FIRST_CONTACT_PHASE_V1.PHASE_1_COHORT;

  const proactiveHardCapPerHour = active ? PHASE_1_HARD_CAP_PER_HOUR_V1 : null;

  return Object.freeze({
    active,
    phase: effectivePhase,
    cohortId: cohortMember.id,
    cohortMember,
    anchorUserPinned: anchorUser,
    calibrationPersistWrite,
    feedbackLoopActive: active,
    feedbackWeight: active ? cohortMember.feedbackWeight : 0,
    proactiveHardCapPerHour,
    lowBudget: active,
    lowBudgetCooldownMinutes: LOW_BUDGET_COOLDOWN_MIN_V1,
    observationWindowHintHours: effectivePhase === FOX_FIRST_CONTACT_PHASE_V1.PHASE_1_COHORT ? 72 : 24
  });
}

export function shouldFoxCalibrationPersistWriteV1() {
  const deploy = resolveFoxFirstContactDeploymentV1();
  if (!deploy.active) return true;
  return deploy.calibrationPersistWrite === true;
}

export function resolveFoxProactiveHardCapPerHourV1(adaptiveMaxPerHour) {
  const deploy = resolveFoxFirstContactDeploymentV1();
  const adaptive = Math.max(1, Math.round(Number(adaptiveMaxPerHour) || 2));
  if (deploy.proactiveHardCapPerHour == null) return adaptive;
  return Math.min(adaptive, deploy.proactiveHardCapPerHour);
}

export function resolveFoxProactiveEffectiveCooldownMinutesV1(adaptiveCooldownMinutes) {
  const deploy = resolveFoxFirstContactDeploymentV1();
  const adaptive = Number(adaptiveCooldownMinutes) || 20;
  if (!deploy.lowBudget) return adaptive;
  return Math.max(adaptive, deploy.lowBudgetCooldownMinutes);
}

/** @internal vitest */
export function __resetFoxFirstContactDeploymentForTestV1() {
  pinFoxFirstContactAnchorUserV1(false);
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.foxFirstContactUrlBootstrapped;
  }
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.removeItem(LS_PHASE_OVERRIDE_V1);
    } catch {
      /* noop */
    }
  }
}
