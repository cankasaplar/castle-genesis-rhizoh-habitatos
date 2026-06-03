/**
 * Organism Stabilization v0 — cross-layer rhythm alignment (single heartbeat).
 * SCR · Studio loop · WAL · Castle · Pet motion · Agent perception latency.
 * @see docs/RHIZOH_ORGANISM_STABILIZATION_V0.md
 */

import {
  deriveOrganismHeartbeatV0,
  ORGANISM_HEARTBEAT_GRID_MS_V0,
  snapToOrganismHeartbeatV0
} from "./rhizohOrganismHeartbeatV0.js";
import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { readPetCitizenV0 } from "./rhizohPetCitizenRuntimeV0.js";
import { readMultiInhabitantCoPresenceV0 } from "./rhizohMultiInhabitantCoPresenceV0.js";
import { tickPerceptualContinuitySmoothingV0 } from "./rhizohPerceptualContinuitySmoothingV0.js";

export const ORGANISM_STABILIZATION_SCHEMA_V0 = "castle.rhizoh.organism_stabilization.v0";

export const RHIZOH_ORGANISM_STABILIZATION_EVENT_V0 = "rhizoh:organism-stabilization-v0";

/** Max layer commit jitter vs heartbeat (ms). */
export const ORGANISM_JITTER_TOLERANCE_MS_V0 = 64;

/** Agent perception latency cap (normalized to grid). */
export const AGENT_PERCEPTION_LATENCY_MAX_MS_V0 = ORGANISM_HEARTBEAT_GRID_MS_V0 / 4;

/** @type {{ phase: string, atMs: number }[]} */
let layerPhaseRing = [];

/** @type {ReturnType<typeof deriveOrganismHeartbeatV0> | null} */
let activeHeartbeat = null;

/** @type {ReturnType<typeof publishOrganismStabilizationV0> | null} */
let lastStabilization = null;

/**
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} frame
 */
export function beginOrganismRhythmCycleV0(frame) {
  layerPhaseRing = [];
  activeHeartbeat = deriveOrganismHeartbeatV0(frame);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.organismHeartbeat = activeHeartbeat;
  }
  return activeHeartbeat;
}

/**
 * @param {string} phase
 * @param {number} [atMs]
 */
export function markOrganismLayerPhaseV0(phase, atMs = Date.now()) {
  layerPhaseRing.push(
    Object.freeze({
      phase: String(phase || "unknown"),
      atMs: Number(atMs) || Date.now()
    })
  );
  if (layerPhaseRing.length > 32) layerPhaseRing.shift();
}

/**
 * @param {ReturnType<typeof deriveOrganismHeartbeatV0>} heartbeat
 * @param {{ phase: string, atMs: number }[]} phases
 */
export function computeRhythmCoherenceV0(heartbeat, phases) {
  const aligned = heartbeat?.aligned_at_ms ?? Date.now();
  const grid = heartbeat?.grid_ms || ORGANISM_HEARTBEAT_GRID_MS_V0;

  const layers = Object.freeze(
    (phases || []).map((p) => {
      const delta = p.atMs - aligned;
      const snapped = snapToOrganismHeartbeatV0(p.atMs, heartbeat);
      return Object.freeze({
        phase: p.phase,
        at_ms: p.atMs,
        delta_from_heartbeat_ms: delta,
        snapped_at_ms: snapped,
        jitter_ms: Math.abs(p.atMs - snapped)
      });
    })
  );

  const maxJitter =
    layers.length > 0 ? Math.max(...layers.map((l) => l.jitter_ms)) : 0;
  const scrTickStable = maxJitter <= ORGANISM_JITTER_TOLERANCE_MS_V0;

  return Object.freeze({
    ok: scrTickStable,
    max_jitter_ms: maxJitter,
    tolerance_ms: ORGANISM_JITTER_TOLERANCE_MS_V0,
    grid_ms: grid,
    aligned_at_ms: aligned,
    layers
  });
}

/**
 * @param {ReturnType<typeof readPetCitizenV0>} pet
 * @param {ReturnType<typeof deriveOrganismHeartbeatV0>} heartbeat
 */
export function applyPetMotionFrameLockV0(pet, heartbeat) {
  if (!pet?.inhabited || !heartbeat) return pet;

  const lock = Object.freeze({
    masterNowMs: heartbeat.masterNowMs,
    tickSeq: heartbeat.tickSeq,
    heartbeat_index: heartbeat.heartbeat_index,
    aligned_at_ms: heartbeat.aligned_at_ms,
    grid_ms: heartbeat.grid_ms,
    phase01: heartbeat.phase01
  });

  const locked = Object.freeze({
    ...pet,
    motion_frame_lock: lock,
    masterNowMs: heartbeat.masterNowMs
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.petCitizen = locked;
    if (window.__rhizoh.petSpatialBinding) {
      window.__rhizoh.petSpatialBinding = Object.freeze({
        ...window.__rhizoh.petSpatialBinding,
        motion_frame_lock: lock
      });
    }
  }
  return locked;
}

/**
 * @param {object[]} agents
 * @param {ReturnType<typeof deriveOrganismHeartbeatV0>} heartbeat
 * @param {number} coPresenceAtMs
 */
export function normalizeAgentPerceptionDelayV0(agents, heartbeat, coPresenceAtMs) {
  const aligned = heartbeat?.aligned_at_ms ?? coPresenceAtMs;
  const rawLatency = Math.max(0, coPresenceAtMs - aligned);

  return Object.freeze(
    (agents || []).map((agent) => {
      const normalized = Math.min(rawLatency, AGENT_PERCEPTION_LATENCY_MAX_MS_V0);
      return Object.freeze({
        ...agent,
        perception_latency_ms_raw: rawLatency,
        perception_latency_ms: normalized,
        perception_aligned: normalized <= AGENT_PERCEPTION_LATENCY_MAX_MS_V0,
        heartbeat_index: heartbeat?.heartbeat_index ?? null
      });
    })
  );
}

/**
 * @param {{
 *   heartbeat?: ReturnType<typeof deriveOrganismHeartbeatV0> | null,
 *   frame?: ReturnType<typeof readLastT0PresenceFrameV0> | null,
 *   run?: object | null
 * }} [ctx]
 */
export function publishOrganismStabilizationV0(ctx = {}) {
  const frame = ctx.frame || readLastT0PresenceFrameV0();
  const heartbeat = ctx.heartbeat || activeHeartbeat || deriveOrganismHeartbeatV0(frame);
  const rhythm = computeRhythmCoherenceV0(heartbeat, layerPhaseRing);

  const petLocked = applyPetMotionFrameLockV0(readPetCitizenV0(), heartbeat);
  const coPresence = readMultiInhabitantCoPresenceV0();
  const coAtMs = Number(coPresence?.atMs) || heartbeat.masterNowMs;

  const agents = normalizeAgentPerceptionDelayV0(
    (coPresence?.inhabitants || []).filter((i) => i.kind === "agent"),
    heartbeat,
    coAtMs
  );

  const agentRhythmOk = agents.every((a) => a.perception_aligned === true);
  const smooth = tickPerceptualContinuitySmoothingV0({ frame, pet: petLocked });

  const report = Object.freeze({
    schema: ORGANISM_STABILIZATION_SCHEMA_V0,
    atMs: heartbeat.masterNowMs,
    heartbeat,
    rhythm,
    agent_rhythm: Object.freeze({
      agents,
      ok: agentRhythmOk,
      latency_max_ms: AGENT_PERCEPTION_LATENCY_MAX_MS_V0
    }),
    pet_motion_locked: Boolean(petLocked?.motion_frame_lock),
    perceptual_smooth: smooth,
    run_id: ctx.run?.wal_entry_id || null,
    ok: rhythm.ok && agentRhythmOk
  });

  lastStabilization = report;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.organismStabilization = report;
    window.__rhizoh.organismRhythm = Object.freeze({
      ok: report.ok,
      heartbeat_index: heartbeat.heartbeat_index,
      max_jitter_ms: rhythm.max_jitter_ms,
      grid_ms: heartbeat.grid_ms
    });

    if (window.__rhizoh.coPresence) {
      window.__rhizoh.coPresence = Object.freeze({
        ...window.__rhizoh.coPresence,
        agent_rhythm: report.agent_rhythm,
        rhythm_ok: report.ok
      });
    }

    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_ORGANISM_STABILIZATION_EVENT_V0, {
          detail: Object.freeze({ report })
        })
      );
    } catch {
      /* noop */
    }
  }

  return report;
}

export function readOrganismStabilizationReportV0() {
  return (
    lastStabilization ||
    (typeof window !== "undefined" ? window.__rhizoh?.organismStabilization : null) ||
    null
  );
}

export function resetRhizohOrganismStabilizationForTestV0() {
  layerPhaseRing = [];
  activeHeartbeat = null;
  lastStabilization = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.organismStabilization;
    delete window.__rhizoh.organismRhythm;
    delete window.__rhizoh.organismHeartbeat;
  }
}
