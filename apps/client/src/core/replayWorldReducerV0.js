/**
 * World reconstruction reducer — rebuild ghosts, gates, collapse state from event log.
 * ENGINE ↔ EVENTS ↔ DB ↔ REPLAY ↔ ENGINE loop (interpretation layer).
 */

import { listSpiralMMOContinentMapPinsV0 } from "../rhizoh/runtime/spiralMMOContinentPinsV0.js";
import { normalizeCodexEventTypeV0 } from "./codexReducerV0.js";

export const RHIZOH_SIMULATION_WORLD_SCHEMA_V0 = "castle.rhizoh.simulation_world.v0";

/**
 * @returns {object}
 */
export function createInitialSimulationWorldV0() {
  const pins = listSpiralMMOContinentMapPinsV0();
  const gates = pins.map((p) =>
    Object.freeze({
      id: String(p.id || p.continent || ""),
      continent: String(p.continent || ""),
      lat: Number(p.lat) || 0,
      lon: Number(p.lon) || 0
    })
  );
  return Object.freeze({
    schema: RHIZOH_SIMULATION_WORLD_SCHEMA_V0,
    seed: 12345,
    cycleLayer: 0,
    gates: Object.freeze(gates),
    activeGhosts: Object.freeze([]),
    ghostLineage: Object.freeze([]),
    collapsing: false,
    voidPending: false,
    lastCollapse: null
  });
}

/**
 * @param {object} world
 * @param {{ type?: string, payload?: object, seq?: number, ts?: number }} event
 */
export function reduceSimulationWorldEventV0(world, event) {
  const base = world && typeof world === "object" ? world : createInitialSimulationWorldV0();
  const type = normalizeCodexEventTypeV0(event?.type);
  const payload = event?.payload && typeof event.payload === "object" ? event.payload : {};
  const seq = Number(event?.seq) || 0;
  const ts = Number(event?.ts) || Date.now();

  if (type === "GHOST_DISPATCH") {
    const ghost = Object.freeze({
      id: String(payload.id || payload.ghostId || `ghost_replay_${seq}`),
      type: String(payload.type || payload.kind || "mirror"),
      origin: String(payload.origin || payload.src || ""),
      destination: String(payload.destination || payload.dst || ""),
      cycleLayer: Number(payload.cycleLayer) || base.cycleLayer || 0,
      preference: String(payload.preference || "adaptive"),
      entropy: Number(payload.entropy) || 0.5,
      spawnedAtSeq: seq,
      spawnedAtMs: ts,
      parentId: String(payload.parentId || "")
    });
    const active = [...(Array.isArray(base.activeGhosts) ? base.activeGhosts : []), ghost];
    const lineage = [...(Array.isArray(base.ghostLineage) ? base.ghostLineage : [])];
    if (payload.parentId) {
      lineage.push(
        Object.freeze({
          ghostId: ghost.id,
          parentId: String(payload.parentId),
          atSeq: seq
        })
      );
    }
    return Object.freeze({
      ...base,
      activeGhosts: Object.freeze(active),
      ghostLineage: Object.freeze(lineage)
    });
  }

  if (type === "GHOST_ARCHIVED") {
    const ghostId = String(payload.id || payload.ghostId || "");
    const active = (Array.isArray(base.activeGhosts) ? base.activeGhosts : []).filter((g) => g.id !== ghostId);
    const archived = (Array.isArray(base.activeGhosts) ? base.activeGhosts : []).find((g) => g.id === ghostId);
    const lineage = [...(Array.isArray(base.ghostLineage) ? base.ghostLineage : [])];
    if (archived) {
      lineage.push(
        Object.freeze({
          ghostId: archived.id,
          origin: archived.origin,
          destination: archived.destination,
          archivedAtSeq: seq,
          archivedAtMs: ts
        })
      );
    }
    return Object.freeze({
      ...base,
      activeGhosts: Object.freeze(active),
      ghostLineage: Object.freeze(lineage)
    });
  }

  if (type === "DIMENSIONAL_COLLAPSE") {
    const cycleLayer = Math.max(0, Number(payload.layer) || Number(base.cycleLayer) + 1);
    const seed = Number.isFinite(Number(payload.seed)) ? Number(payload.seed) : base.seed;
    return Object.freeze({
      ...base,
      cycleLayer,
      seed,
      activeGhosts: Object.freeze([]),
      collapsing: false,
      voidPending: false,
      lastCollapse: Object.freeze({
        layer: cycleLayer,
        seed,
        atSeq: seq,
        atMs: ts
      })
    });
  }

  if (type === "AWAKEN") {
    const cycleLayer = Math.max(0, Number(base.cycleLayer) || 0) + 1;
    const seed = Number.isFinite(Number(payload.cycleSeed)) ? Number(payload.cycleSeed) : base.seed;
    return Object.freeze({
      ...base,
      cycleLayer,
      seed,
      voidPending: false
    });
  }

  return base;
}

/**
 * @param {object[]} events
 * @param {object} [initial]
 */
export function foldSimulationWorldEventsV0(events, initial) {
  let world = initial || createInitialSimulationWorldV0();
  const list = Array.isArray(events) ? events : [];
  for (const event of list) {
    world = reduceSimulationWorldEventV0(world, event);
  }
  return world;
}
