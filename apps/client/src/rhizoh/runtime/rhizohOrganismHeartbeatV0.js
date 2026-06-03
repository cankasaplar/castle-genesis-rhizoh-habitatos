/**
 * Organism Heartbeat v0 — single rhythm grid anchored to T0 master clock.
 * @see docs/RHIZOH_ORGANISM_STABILIZATION_V0.md
 */

import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";

export const ORGANISM_HEARTBEAT_SCHEMA_V0 = "castle.rhizoh.organism_heartbeat.v0";

/** Shared rhythm grid (ms) — cross-layer alignment target. */
export const ORGANISM_HEARTBEAT_GRID_MS_V0 = 1000;

/**
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} [frame]
 * @param {number} [nowMs]
 */
export function deriveOrganismHeartbeatV0(frame, nowMs = Date.now()) {
  const f = frame || readLastT0PresenceFrameV0();
  const masterNowMs = Number(f?.masterNowMs) || nowMs;
  const origin = Number(f?.presenceClockOriginMs) || masterNowMs;
  const grid = ORGANISM_HEARTBEAT_GRID_MS_V0;
  const elapsed = Math.max(0, masterNowMs - origin);
  const heartbeatIndex = Math.floor(elapsed / grid);
  const phaseMs = elapsed % grid;
  const alignedAtMs = origin + heartbeatIndex * grid;

  return Object.freeze({
    schema: ORGANISM_HEARTBEAT_SCHEMA_V0,
    masterNowMs,
    tickSeq: f?.tickSeq ?? null,
    coherence_id: f?.coherenceId || null,
    presence_clock_origin_ms: origin,
    grid_ms: grid,
    heartbeat_index: heartbeatIndex,
    phase_ms: phaseMs,
    aligned_at_ms: alignedAtMs,
    phase01: phaseMs / grid
  });
}

/**
 * Snap arbitrary layer timestamp to nearest heartbeat boundary.
 * @param {number} atMs
 * @param {ReturnType<typeof deriveOrganismHeartbeatV0>} heartbeat
 */
export function snapToOrganismHeartbeatV0(atMs, heartbeat) {
  const t = Number(atMs) || Date.now();
  const origin = heartbeat?.presence_clock_origin_ms ?? t;
  const grid = heartbeat?.grid_ms || ORGANISM_HEARTBEAT_GRID_MS_V0;
  const idx = Math.round((t - origin) / grid);
  return origin + idx * grid;
}

export function readOrganismHeartbeatFromWindowV0() {
  return typeof window !== "undefined" ? window.__rhizoh?.organismHeartbeat || null : null;
}
