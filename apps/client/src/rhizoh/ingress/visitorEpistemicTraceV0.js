/**
 * Visitor Epistemic Trace v0 — session-scoped observation path (NOT memory / NOT identity SSOT).
 * @see docs/RHIZOH_VISITOR_EPISTEMIC_TRACE_V0.md
 */

import { readObserverInviteContextV0 } from "./observerInviteLandingV0.js";

export const VISITOR_EPISTEMIC_TRACE_SCHEMA_V0 = "castle.rhizoh.visitor_epistemic_trace.v0";

const STORAGE_KEY_V0 = "rhizoh.visitor_epistemic_trace.v0";
const SURFACE_ORDER_V0 = Object.freeze(["invite", "chat", "map", "chess", "castle"]);

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
    const raw = sessionStorage.getItem(STORAGE_KEY_V0);
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
      sessionStorage.setItem(STORAGE_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

function computeEngagementVectorV0(path, visitCounts) {
  const unique = new Set(path).size;
  const diversity = unique / SURFACE_ORDER_V0.length;
  const depth = Math.min(1, Object.values(visitCounts).reduce((a, b) => a + b, 0) / 12);
  return Math.round(Math.min(1, diversity * 0.65 + depth * 0.35) * 100) / 100;
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

/**
 * @param {string} surface
 */
export function recordVisitorSurfaceV0(surface) {
  const normalized = normalizeVisitorSurfaceV0(surface);
  if (!normalized) return null;

  const now = Date.now();
  const invite = readObserverInviteContextV0();
  const prev = readTraceRowV0();
  const path = [...(prev?.path || [])];
  if (path[path.length - 1] !== normalized) {
    path.push(normalized);
  }
  const visitCounts = { ...(prev?.visitCounts || {}) };
  visitCounts[normalized] = (visitCounts[normalized] || 0) + 1;

  const engagement = computeEngagementVectorV0(path, visitCounts);
  const trace = Object.freeze({
    schema: VISITOR_EPISTEMIC_TRACE_SCHEMA_V0,
    visitor_session: "anonymous",
    cohortId: invite?.cohortId ?? null,
    perceptionMode: invite?.perceptionMode ?? null,
    path: Object.freeze([...path]),
    visitCounts: Object.freeze({ ...visitCounts }),
    engagement_vector: engagement,
    return_probability: computeReturnProbabilityV0(path, engagement),
    updatedAtMs: now,
    interpretationOnly: true,
    readOnly: true,
    isMemory: false,
    influencesExecution: false
  });

  writeTraceRowV0(trace);
  syncVisitorTraceWindowV0(trace);
  return trace;
}

export function getVisitorEpistemicTraceV0() {
  const row = readTraceRowV0();
  if (row) return Object.freeze({ ...row, interpretationOnly: true, isMemory: false });
  return Object.freeze({
    schema: VISITOR_EPISTEMIC_TRACE_SCHEMA_V0,
    visitor_session: "anonymous",
    path: Object.freeze([]),
    engagement_vector: 0,
    return_probability: 0,
    interpretationOnly: true,
    readOnly: true,
    isMemory: false
  });
}

export function clearVisitorEpistemicTraceForTestV0() {
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(STORAGE_KEY_V0);
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

  window.addEventListener("rhizoh:invite-proceed-v0", () => {
    recordVisitorSurfaceV0("chat");
  });

  window.addEventListener("rhizoh:map-camera-feedback-v0", () => {
    recordVisitorSurfaceV0("map");
  });

  const maybeMapFromPath = () => {
    const p = String(window.location?.pathname || "");
    if (p.includes("/world")) recordVisitorSurfaceV0("map");
  };
  window.addEventListener("popstate", maybeMapFromPath);
  maybeMapFromPath();
}
