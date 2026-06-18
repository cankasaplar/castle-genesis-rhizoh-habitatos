/**
 * Drift Cube — Experience Coordinate System (observation only).
 * RESEARCH-ONLY: never writes WAL, gateway, or execution paths.
 */

import {
  buildChessDriftLogEnvelopeV0,
  logChessTelemetryGatedV0,
  shouldLogChessGeometryDriftV0
} from "./chessTelemetryLogV0.js";

export const RHIZOH_DRIFT_CUBE_SCHEMA_V0 = "rhizoh.drift_cube_point.v0";
export const RHIZOH_DRIFT_CUBE_EVENT_V0 = "rhizoh:geometry-drift-cube-v0";
export const RHIZOH_DRIFT_CUBE_LOG_TAG_V0 = "[CASTLE_geometry_drift]";

const RING_MAX_V0 = 128;

/** @type {object[]} */
let ringV0 = [];

function ensureWindowApiV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  if (window.__rhizoh.geometryDriftCube) return;

  window.__rhizoh.geometryDriftCube = Object.freeze({
    list: () => Object.freeze([...ringV0]),
    summary: () => summarizeDriftCubeV0(ringV0),
    clear: () => {
      ringV0 = [];
      return Object.freeze([]);
    }
  });
}

/**
 * @param {readonly object[]} points
 */
export function summarizeDriftCubeV0(points = []) {
  const families = { enclosure: 0, jump: 0, cluster: 0 };
  let zSum = 0;
  let zMax = 0;
  let familyMismatch = 0;

  for (const p of points) {
    const fam = p?.context?.playedPattern;
    if (fam && fam in families) families[fam] += 1;
    const z = Number(p?.z) || 0;
    zSum += z;
    zMax = Math.max(zMax, z);
    if (p?.drift?.familyMatch === false) familyMismatch += 1;
  }

  const n = points.length || 1;
  return Object.freeze({
    schema: "rhizoh.drift_cube_summary.v0",
    count: points.length,
    meanZ: points.length ? zSum / n : 0,
    maxZ: zMax,
    familyMismatch,
    playedFamilies: families,
    enclosureRatio: points.length ? families.enclosure / points.length : 0
  });
}

/**
 * @param {{
 *   x: readonly number[]|string,
 *   y: number|string,
 *   z: number,
 *   sourceSpace?: string,
 *   matchId?: string|null,
 *   played?: object|null,
 *   expected?: object|null,
 *   drift?: object|null
 * }} opts
 */
export function commitDriftCubeObservationV0(opts) {
  const point = Object.freeze({
    schema: RHIZOH_DRIFT_CUBE_SCHEMA_V0,
    sourceSpace: String(opts.sourceSpace || "chess"),
    matchId: opts.matchId || null,
    x: opts.x,
    y: opts.y,
    z: Math.max(0, Math.min(1, Number(opts.z) || 0)),
    drift: opts.drift ? Object.freeze({ ...opts.drift }) : null,
    context: Object.freeze({
      playedPattern: opts.played?.patternFamily || null,
      expectedPattern: opts.expected?.patternFamily || null
    }),
    observedAt: new Date().toISOString()
  });

  ringV0 = [point, ...ringV0].slice(0, RING_MAX_V0);
  ensureWindowApiV0();

  if (typeof console !== "undefined" && console.info) {
    const familyMismatch = point.context.playedPattern !== point.context.expectedPattern;
    if (
      shouldLogChessGeometryDriftV0({
        matchId: point.matchId,
        moveNumber: point.y,
        z: point.z,
        driftMagnitude: point.z,
        familyMismatch
      })
    ) {
      logChessTelemetryGatedV0(
        "info",
        RHIZOH_DRIFT_CUBE_LOG_TAG_V0,
        buildChessDriftLogEnvelopeV0(familyMismatch || point.z >= 0.12 ? "warn" : "info", {
          matchId: point.matchId,
          moveNumber: point.y,
          z: point.z,
          entropyScore: point.z,
          playedFamily: point.context.playedPattern,
          expectedFamily: point.context.expectedPattern,
          familyMismatch
        })
      );
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(RHIZOH_DRIFT_CUBE_EVENT_V0, { detail: point }));
    } catch {
      /* noop */
    }
  }

  return point;
}

export function readDriftCubeRingV0() {
  return Object.freeze([...ringV0]);
}

export function resetDriftCubeRingV0() {
  ringV0 = [];
}
