/**
 * Flow Continuity Layer (FCL) v0 — entry · drift · return · since-last-visit.
 * @see docs/RHIZOH_FLOW_CONTINUITY_LAYER_V0.md
 */

import {
  ARL_PHASE_COGNITION_PULSE_V0,
  ARL_PHASE_DIRECTION_V0,
  ARL_PHASE_SILENCE_V0,
  ARL_PHASE_STABILIZE_QUIET_V0
} from "./rhizohAttentionRhythmV0.js";
import { inferT0UserIntentFromSurfaceV0, T0_INTENT_ANCHORS_V0 } from "./t0ContextStripV0.js";

export const RHIZOH_FLOW_CONTINUITY_CONTRACT_V0 = "rhizoh-flow-continuity-v0";

export const FCL_BINDING_SENTENCE_V0 =
  "Rhizoh remembers where play began, where it continues, and when you may return without ceremony.";

export const RHIZOH_PRODUCT_BINDING_V0 =
  "Rhizoh is a continuity-first cognitive operating system for human interaction with evolving digital environments.";

export const RHIZOH_FLOW_CONTINUITY_EVENT_V0 = "rhizoh:flow-continuity";

export const FCL_ENTRY_FIRST_V0 = "first_continuity";
export const FCL_ENTRY_RETURN_V0 = "return_continuity";
export const FCL_ENTRY_SAME_SESSION_V0 = "same_session";

const SESSION_KEY_V0 = "rhizoh.flow.continuity.v0";
const LAST_VISIT_KEY_V0 = "rhizoh.flow.last_visit.v0";
const MAX_RHYTHM_HISTORY_V0 = 8;
const MAX_DRIFT_STEPS_V0 = 12;

/**
 * @param {string} intentId
 * @param {boolean} tr
 */
function intentLabelV0(intentId, tr) {
  const row = T0_INTENT_ANCHORS_V0.find((a) => a.id === intentId);
  if (!row) return intentId;
  return tr ? row.label_tr : row.label_en;
}

/**
 * @param {string} surface
 * @param {boolean} tr
 */
function surfaceLabelV0(surface, tr) {
  const s = String(surface || "world");
  const map = tr
    ? {
        world: "Dünya",
        studio: "Stüdyo",
        broadcast: "Yayın",
        hall: "Salon",
        greenroom: "Green Room",
        profile: "Profil"
      }
    : {
        world: "World",
        studio: "Studio",
        broadcast: "Broadcast",
        hall: "Hall",
        greenroom: "Green Room",
        profile: "Profile"
      };
  return map[s] || s;
}

function readFlowStateRawV0() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeFlowStateRawV0(state) {
  try {
    sessionStorage.setItem(SESSION_KEY_V0, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * @returns {{ surface: string, intent: string, at: number } | null}
 */
export function readLastVisitSnapshotV0() {
  try {
    const raw = localStorage.getItem(LAST_VISIT_KEY_V0);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object") return null;
    return {
      surface: String(p.surface || "world"),
      intent: String(p.intent || "explore"),
      at: Number(p.at) || 0
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} surface
 * @param {string} intent
 */
export function snapshotLastVisitV0(surface, intent) {
  try {
    localStorage.setItem(
      LAST_VISIT_KEY_V0,
      JSON.stringify({
        surface: String(surface || "world"),
        intent: String(intent || "explore"),
        at: Date.now()
      })
    );
  } catch {
    /* ignore */
  }
}

/**
 * Entry state resolver — first continuity vs return vs same session.
 * @param {{ activeSurface?: string, userIntent?: string | null, localeTr?: boolean }} input
 */
export function resolveEntryContinuityV0(input = {}) {
  const tr = input.localeTr !== false;
  const surface = String(input.activeSurface || "world");
  const intent =
    input.userIntent || inferT0UserIntentFromSurfaceV0(surface, input.userIntent);
  const lastVisit = readLastVisitSnapshotV0();
  const sessionFlow = readFlowStateRawV0();

  let entryMode = FCL_ENTRY_SAME_SESSION_V0;
  if (!sessionFlow && !lastVisit) {
    entryMode = FCL_ENTRY_FIRST_V0;
  } else if (!sessionFlow && lastVisit) {
    entryMode = FCL_ENTRY_RETURN_V0;
  }

  let orientationLine;
  if (entryMode === FCL_ENTRY_FIRST_V0) {
    orientationLine = tr
      ? "Buradasın · süreklilik yüzeyi hazır · Keşfet ile başlayabilirsin"
      : "You are here · continuity surface ready · start with Explore";
  } else if (entryMode === FCL_ENTRY_RETURN_V0) {
    orientationLine = tr
      ? `Geri geldin · son: ${intentLabelV0(lastVisit.intent, true)} · ${surfaceLabelV0(lastVisit.surface, true)}`
      : `Welcome back · last: ${intentLabelV0(lastVisit.intent, false)} · ${surfaceLabelV0(lastVisit.surface, false)}`;
  } else {
    orientationLine = tr
      ? `Buradasın · ${intentLabelV0(intent, true)} · ${surfaceLabelV0(surface, true)}`
      : `You are here · ${intentLabelV0(intent, false)} · ${surfaceLabelV0(surface, false)}`;
  }

  return Object.freeze({
    entry_mode: entryMode,
    orientation_line: orientationLine,
    last_visit: lastVisit ? Object.freeze({ ...lastVisit }) : null
  });
}

/**
 * @param {string} userInput
 * @param {string} surface
 * @param {string} intent
 */
export function recordFlowIntentV0(userInput, surface, intent) {
  const state = readFlowStateRawV0();
  if (!state) return;
  state.last_stated_intent = String(intent || "");
  state.last_stated_surface = String(surface || "world");
  state.last_input = String(userInput || "").slice(0, 200);
  writeFlowStateRawV0(state);
}

/**
 * Drift tracker — wanted vs where play drifted.
 * @param {{ activeSurface?: string, userIntent?: string | null, localeTr?: boolean }} input
 */
export function resolveFlowDriftV0(input = {}) {
  const tr = input.localeTr !== false;
  const state = readFlowStateRawV0();
  if (!state) {
    return Object.freeze({ has_drift: false, drift_line: null, steps: Object.freeze([]) });
  }

  const currentSurface = String(input.activeSurface || state.current_surface || "world");
  const currentIntent =
    input.userIntent ||
    state.current_intent ||
    inferT0UserIntentFromSurfaceV0(currentSurface);

  const wantedIntent = String(state.last_stated_intent || state.origin_intent || currentIntent);
  const wantedSurface = String(state.last_stated_surface || state.origin_surface || currentSurface);

  const hasDrift =
    currentIntent !== wantedIntent || currentSurface !== wantedSurface;

  const steps = Array.isArray(state.drift_steps) ? state.drift_steps : [];
  let driftLine = null;
  if (hasDrift) {
    driftLine = tr
      ? `Kayma · ${intentLabelV0(wantedIntent, true)} → ${intentLabelV0(currentIntent, true)}`
      : `Drift · ${intentLabelV0(wantedIntent, false)} → ${intentLabelV0(currentIntent, false)}`;
  }

  return Object.freeze({
    has_drift: hasDrift,
    wanted_intent: wantedIntent,
    wanted_surface: wantedSurface,
    current_intent: currentIntent,
    current_surface: currentSurface,
    drift_line: driftLine,
    steps: Object.freeze([...steps])
  });
}

/**
 * What changed since last visit (cross-session).
 * @param {{ activeSurface?: string, userIntent?: string | null, localeTr?: boolean }} input
 */
export function generateSinceLastVisitV0(input = {}) {
  const tr = input.localeTr !== false;
  const lastVisit = readLastVisitSnapshotV0();
  const surface = String(input.activeSurface || "world");
  const intent =
    input.userIntent || inferT0UserIntentFromSurfaceV0(surface, input.userIntent);

  if (!lastVisit) {
    return Object.freeze({
      has_prior_visit: false,
      since_last_visit_line: null
    });
  }

  const surfaceChanged = lastVisit.surface !== surface;
  const intentChanged = lastVisit.intent !== intent;

  if (!surfaceChanged && !intentChanged) {
    const line = tr
      ? "Son ziyaretle aynı yerdesin · süreklilik devam ediyor"
      : "Same place as last visit · continuity continues";
    return Object.freeze({
      has_prior_visit: true,
      since_last_visit_line: line,
      surface_changed: false,
      intent_changed: false
    });
  }

  const line = tr
    ? `Son ziyaret: ${surfaceLabelV0(lastVisit.surface, true)} · ${intentLabelV0(lastVisit.intent, true)} → şimdi ${surfaceLabelV0(surface, true)}`
    : `Since last visit: ${surfaceLabelV0(lastVisit.surface, false)} → now ${surfaceLabelV0(surface, false)}`;

  return Object.freeze({
    has_prior_visit: true,
    since_last_visit_line: line,
    surface_changed: surfaceChanged,
    intent_changed: intentChanged,
    prior_surface: lastVisit.surface,
    prior_intent: lastVisit.intent
  });
}

/**
 * Return state builder — continued state, not reset.
 * @param {ReturnType<typeof resolveFlowContinuityV0>} flow
 * @param {{ localeTr?: boolean }} [opts]
 */
export function buildReturnContinuityV0(flow, opts = {}) {
  const tr = opts.localeTr !== false;
  if (!flow?.can_return) {
    return Object.freeze({ active: false, continued_not_reset: true });
  }

  return Object.freeze({
    active: true,
    continued_not_reset: true,
    return_surface: flow.return_surface,
    return_intent: flow.return_intent,
    return_line: flow.return_line,
    resume_line: tr
      ? "Kaldığın yerden devam · boş ekran yok"
      : "Resume from where you left · no empty screen"
  });
}

/**
 * @param {{
 *   activeSurface?: string,
 *   userIntent?: string | null,
 *   rhythmPhase?: string,
 *   forceOrigin?: boolean
 * }} input
 */
export function recordFlowContinuityStepV0(input = {}) {
  const surface = String(input.activeSurface || "world");
  const intent =
    input.userIntent || inferT0UserIntentFromSurfaceV0(surface, input.userIntent);
  const rhythm = String(input.rhythmPhase || ARL_PHASE_DIRECTION_V0);
  const now = Date.now();

  let state = readFlowStateRawV0();
  if (!state || input.forceOrigin) {
    state = {
      origin_surface: surface,
      origin_intent: intent,
      origin_at: now,
      prior_surface: surface,
      prior_intent: intent,
      current_surface: surface,
      current_intent: intent,
      current_rhythm_phase: rhythm,
      last_stated_intent: intent,
      last_stated_surface: surface,
      rhythm_history: [{ phase: rhythm, at: now }],
      drift_steps: []
    };
    writeFlowStateRawV0(state);
    return Object.freeze({ ...state });
  }

  if (state.current_surface !== surface || state.current_intent !== intent) {
    const driftSteps = Array.isArray(state.drift_steps) ? [...state.drift_steps] : [];
    driftSteps.push(
      Object.freeze({
        from_surface: state.current_surface,
        from_intent: state.current_intent,
        to_surface: surface,
        to_intent: intent,
        at: now
      })
    );
    while (driftSteps.length > MAX_DRIFT_STEPS_V0) driftSteps.shift();
    state.drift_steps = driftSteps;
    state.prior_surface = state.current_surface;
    state.prior_intent = state.current_intent;
    state.current_surface = surface;
    state.current_intent = intent;
  }

  state.current_rhythm_phase = rhythm;
  const history = Array.isArray(state.rhythm_history) ? [...state.rhythm_history] : [];
  const last = history[history.length - 1];
  if (!last || last.phase !== rhythm) {
    history.push({ phase: rhythm, at: now });
    while (history.length > MAX_RHYTHM_HISTORY_V0) history.shift();
  }
  state.rhythm_history = history;

  writeFlowStateRawV0(state);
  return Object.freeze({ ...state });
}

/**
 * @param {{
 *   activeSurface?: string,
 *   userIntent?: string | null,
 *   rhythmPhase?: string,
 *   localeTr?: boolean
 * }} [input]
 */
export function resolveFlowContinuityV0(input = {}) {
  const tr = input.localeTr !== false;
  const surface = String(input.activeSurface || "world");
  const intent =
    input.userIntent || inferT0UserIntentFromSurfaceV0(surface, input.userIntent);
  const rhythm = String(input.rhythmPhase || ARL_PHASE_DIRECTION_V0);

  const state =
    readFlowStateRawV0() ||
    recordFlowContinuityStepV0({
      activeSurface: surface,
      userIntent: intent,
      rhythmPhase: rhythm,
      forceOrigin: true
    });

  const entry = resolveEntryContinuityV0({ activeSurface: surface, userIntent: intent, localeTr: tr });
  const sinceLast = generateSinceLastVisitV0({ activeSurface: surface, userIntent: intent, localeTr: tr });
  const drift = resolveFlowDriftV0({ activeSurface: surface, userIntent: intent, localeTr: tr });

  const originSurface = String(state.origin_surface || surface);
  const originIntent = String(state.origin_intent || intent);
  const currentSurface = String(state.current_surface || surface);
  const currentIntent = String(state.current_intent || intent);
  const priorSurface = String(state.prior_surface || originSurface);
  const priorIntent = String(state.prior_intent || originIntent);

  const divergedFromOrigin =
    currentSurface !== originSurface || currentIntent !== originIntent;
  const hasPrior =
    priorSurface !== currentSurface || priorIntent !== currentIntent;

  const returnRhythms = new Set([
    ARL_PHASE_SILENCE_V0,
    ARL_PHASE_STABILIZE_QUIET_V0,
    ARL_PHASE_DIRECTION_V0
  ]);
  const canReturn =
    (divergedFromOrigin || hasPrior) &&
    returnRhythms.has(rhythm) &&
    rhythm !== ARL_PHASE_COGNITION_PULSE_V0;

  const returnSurface = hasPrior ? priorSurface : originSurface;
  const returnIntent = hasPrior ? priorIntent : originIntent;

  const originLine = tr
    ? `Başlangıç · ${intentLabelV0(originIntent, true)} · ${surfaceLabelV0(originSurface, true)}`
    : `Origin · ${intentLabelV0(originIntent, false)} · ${surfaceLabelV0(originSurface, false)}`;

  const continueLine = tr
    ? `Devam · ${intentLabelV0(currentIntent, true)} · ${surfaceLabelV0(currentSurface, true)}`
    : `Continue · ${intentLabelV0(currentIntent, false)} · ${surfaceLabelV0(currentSurface, false)}`;

  const rhythmLine = tr ? `Ritim · ${rhythm}` : `Rhythm · ${rhythm}`;

  const returnLine = canReturn
    ? tr
      ? `Geri dönebilirsin · ${surfaceLabelV0(returnSurface, true)}`
      : `You may return · ${surfaceLabelV0(returnSurface, false)}`
    : null;

  const flowLine = `${originLine} → ${continueLine}`;

  const core = Object.freeze({
    contract_version: RHIZOH_FLOW_CONTINUITY_CONTRACT_V0,
    binding: FCL_BINDING_SENTENCE_V0,
    product_binding: RHIZOH_PRODUCT_BINDING_V0,
    origin_surface: originSurface,
    origin_intent: originIntent,
    current_surface: currentSurface,
    current_intent: currentIntent,
    prior_surface: priorSurface,
    prior_intent: priorIntent,
    current_rhythm_phase: rhythm,
    rhythm_history: Object.freeze([...(state.rhythm_history || [])]),
    diverged_from_origin: divergedFromOrigin,
    can_return: canReturn,
    return_surface: canReturn ? returnSurface : null,
    return_intent: canReturn ? returnIntent : null,
    flow_line: flowLine,
    rhythm_line: rhythmLine,
    return_line: returnLine
  });

  const returnState = buildReturnContinuityV0(core, { localeTr: tr });

  return Object.freeze({
    ...core,
    entry,
    since_last: sinceLast,
    drift,
    return_state: returnState,
    orientation_line: entry.orientation_line,
    since_last_visit_line: sinceLast.since_last_visit_line,
    drift_line: drift.drift_line
  });
}

/**
 * @param {ReturnType<typeof resolveFlowContinuityV0>} flow
 */
export function emitFlowContinuityV0(flow) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_FLOW_CONTINUITY_EVENT_V0, { detail: flow })
  );
}
