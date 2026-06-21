/**
 * Visitor Epistemic Trace v0 — echo trace (NOT memory · NOT identity SSOT).
 * Validated observer node posture: in graph as observer, non-executive.
 * @see docs/RHIZOH_VISITOR_EPISTEMIC_TRACE_V0.md
 */

import { readObserverInviteContextV0 } from "./observerInviteLandingV0.js";

export const VISITOR_EPISTEMIC_TRACE_SCHEMA_V0 = "castle.rhizoh.visitor_epistemic_trace.v0";

const TRACE_SESSION_KEY_V0 = "rhizoh.visitor_epistemic_trace.v0";
const ECHO_STORAGE_KEY_V0 = "rhizoh.visitor_echo_trace.v0";
const SESSION_MARKER_KEY_V0 = "rhizoh.visitor_session_marker.v0";

const SURFACE_ORDER_V0 = Object.freeze(["invite", "chat", "map", "chess", "castle"]);
const EPISTEMIC_SURFACES_V0 = Object.freeze(["map", "chess", "castle"]);

export const RETURN_VECTOR_V0 = Object.freeze({
  NONE: "none",
  WEAK_IDENTITY_RESONANCE: "weak_identity_resonance",
  MODERATE_CO_OBSERVATION: "moderate_co_observation",
  STRONG_RETURN_ECHO: "strong_return_echo"
});

/** @type {boolean} */
let wireInstalledV0 = false;

/**
 * @param {string} surface
 */
export function normalizeVisitorSurfaceV0(surface) {
  const s = String(surface || "").trim().toLowerCase();
  if (SURFACE_ORDER_V0.includes(s)) return s;
  if (s === "world" || s === "world_space" || s === "fly_to") return "map";
  return null;
}

function readTraceRowV0() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TRACE_SESSION_KEY_V0);
    if (!raw) return null;
    const row = JSON.parse(raw);
    if (!row || typeof row !== "object") return null;
    return row;
  } catch {
    return null;
  }
}

function writeTraceRowV0(row) {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(TRACE_SESSION_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

function readEchoRowV0() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(ECHO_STORAGE_KEY_V0);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeEchoRowV0(row) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ECHO_STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

function touchSessionCountV0() {
  if (typeof sessionStorage === "undefined" || typeof localStorage === "undefined") return 1;
  const marker = sessionStorage.getItem(SESSION_MARKER_KEY_V0);
  const echo = readEchoRowV0() || { sessions: 0, visited_surfaces: [] };
  if (marker === "1") return echo.sessions || 1;
  sessionStorage.setItem(SESSION_MARKER_KEY_V0, "1");
  const sessions = (echo.sessions || 0) + 1;
  writeEchoRowV0({ ...echo, sessions, visitor_id: "anon" });
  return sessions;
}

function mergeVisitedSurfacesV0(path) {
  const echo = readEchoRowV0() || { sessions: 0, visited_surfaces: [] };
  const merged = [...new Set([...(echo.visited_surfaces || []), ...path])].filter((s) =>
    EPISTEMIC_SURFACES_V0.includes(s)
  );
  writeEchoRowV0({
    ...echo,
    visitor_id: "anon",
    visited_surfaces: merged,
    sessions: echo.sessions || touchSessionCountV0()
  });
  return merged;
}

function computeEngagementVectorV0(path, visitCounts) {
  const unique = new Set(path).size;
  const diversity = unique / SURFACE_ORDER_V0.length;
  const depth = Math.min(1, Object.values(visitCounts).reduce((a, b) => a + b, 0) / 12);
  return Math.round(Math.min(1, diversity * 0.65 + depth * 0.35) * 100) / 100;
}

function computeCoherenceAlignmentV0(visitedSurfaces) {
  const hit = EPISTEMIC_SURFACES_V0.filter((s) => visitedSurfaces.includes(s)).length;
  return Math.round((hit / EPISTEMIC_SURFACES_V0.length) * 100) / 100;
}

function computeReturnVectorV0(sessions, coherence, engagement) {
  if (sessions >= 3 && coherence >= 0.66) return RETURN_VECTOR_V0.STRONG_RETURN_ECHO;
  if (sessions >= 2 && coherence >= 0.33) return RETURN_VECTOR_V0.MODERATE_CO_OBSERVATION;
  if (sessions >= 2 || engagement >= 0.3) return RETURN_VECTOR_V0.WEAK_IDENTITY_RESONANCE;
  return RETURN_VECTOR_V0.NONE;
}

function computeReturnProbabilityV0(path, engagement) {
  if (path.includes("map") && path.includes("chat")) {
    return Math.round(Math.min(0.92, 0.45 + engagement * 0.4) * 100) / 100;
  }
  if (path.length >= 2) {
    return Math.round(Math.min(0.75, 0.35 + engagement * 0.35) * 100) / 100;
  }
  return Math.round(Math.min(0.55, 0.25 + engagement * 0.25) * 100) / 100;
}

function buildTraceSnapshotV0(path, visitCounts, invite) {
  const sessions = touchSessionCountV0();
  const visited_surfaces = mergeVisitedSurfacesV0(path);
  const engagement = computeEngagementVectorV0(path, visitCounts);
  const coherence_alignment = computeCoherenceAlignmentV0(visited_surfaces);
  const return_vector = computeReturnVectorV0(sessions, coherence_alignment, engagement);

  return Object.freeze({
    schema: VISITOR_EPISTEMIC_TRACE_SCHEMA_V0,
    visitor_id: "anon",
    visitor_session: "anonymous",
    sessions,
    cohortId: invite?.cohortId ?? null,
    perceptionMode: invite?.perceptionMode ?? null,
    path: Object.freeze([...path]),
    visited_surfaces: Object.freeze([...visited_surfaces]),
    visitCounts: Object.freeze({ ...visitCounts }),
    engagement_vector: engagement,
    return_probability: computeReturnProbabilityV0(path, engagement),
    coherence_alignment,
    return_vector,
    updatedAtMs: Date.now(),
    interpretationOnly: true,
    readOnly: true,
    isMemory: false,
    isIdentity: false,
    isEchoTrace: true,
    influencesExecution: false
  });
}

/**
 * @param {string} surface
 */
export function recordVisitorSurfaceV0(surface) {
  const normalized = normalizeVisitorSurfaceV0(surface);
  if (!normalized) return null;

  const invite = readObserverInviteContextV0();
  const prev = readTraceRowV0();
  const path = [...(prev?.path || [])];
  if (path[path.length - 1] !== normalized) {
    path.push(normalized);
  }
  const visitCounts = { ...(prev?.visitCounts || {}) };
  visitCounts[normalized] = (visitCounts[normalized] || 0) + 1;

  const trace = buildTraceSnapshotV0(path, visitCounts, invite);
  writeTraceRowV0(trace);
  syncVisitorTraceWindowV0(trace);
  return trace;
}

export function getVisitorEpistemicTraceV0() {
  const row = readTraceRowV0();
  if (row) {
    return Object.freeze({
      ...row,
      interpretationOnly: true,
      isMemory: false,
      isIdentity: false,
      isEchoTrace: true
    });
  }
  const echo = readEchoRowV0();
  return Object.freeze({
    schema: VISITOR_EPISTEMIC_TRACE_SCHEMA_V0,
    visitor_id: "anon",
    visitor_session: "anonymous",
    sessions: echo?.sessions ?? 0,
    path: Object.freeze([]),
    visited_surfaces: Object.freeze(echo?.visited_surfaces ?? []),
    engagement_vector: 0,
    return_probability: 0,
    coherence_alignment: 0,
    return_vector: RETURN_VECTOR_V0.NONE,
    interpretationOnly: true,
    readOnly: true,
    isMemory: false,
    isIdentity: false,
    isEchoTrace: true
  });
}

export function clearVisitorEpistemicTraceForTestV0() {
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(TRACE_SESSION_KEY_V0);
      sessionStorage.removeItem(SESSION_MARKER_KEY_V0);
    }
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(ECHO_STORAGE_KEY_V0);
    }
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.visitorTrace;
  }
}

function syncVisitorTraceWindowV0(trace) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh_visitor_epistemic_trace = trace;
  window.__rhizoh.visitorTrace = Object.freeze({
    record: recordVisitorSurfaceV0,
    snapshot: getVisitorEpistemicTraceV0,
    clear: clearVisitorEpistemicTraceForTestV0
  });
}

export function mountVisitorEpistemicTraceConsoleV0() {
  if (typeof window === "undefined") return;
  syncVisitorTraceWindowV0(getVisitorEpistemicTraceV0());
}

export function installVisitorEpistemicTraceWireV0() {
  if (typeof window === "undefined" || wireInstalledV0) return;
  wireInstalledV0 = true;
  mountVisitorEpistemicTraceConsoleV0();
  touchSessionCountV0();

  const maybeMapFromPath = () => {
    const p = String(window.location?.pathname || "");
    if (p.includes("/world")) {
      void import("./observerReadOnlyHookV0.js")
        .then((m) =>
          m.observeV0({ type: "world_path", target: p, meta: { surface: "map", focus: 0.25 } })
        )
        .catch(() => {});
    }
  };
  window.addEventListener("popstate", maybeMapFromPath);
  maybeMapFromPath();
}
