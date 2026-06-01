/**
 * Projection Activation Layer v0 — earned visibility (map_pin threshold, castle reveal).
 * @see docs/RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md
 */

import { getLifeContinuityStoreV0 } from "./lifeContinuityStoreV0.js";
import { getLifeEntityGraphV0 } from "./lifeEntityGraphV0.js";

export const PAL_VERSION_V0 = "projection-activation-v0";

/** @type {Map<string, Set<string>>} userId → castle ids that already emerged this process */
const emergenceSeen = new Map();

export function isProjectionActivationEnabledV0() {
  return String(process.env.CASTLE_PROJECTION_ACTIVATION || "").trim() === "1";
}

function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export function readProjectionActivationThresholdsV0() {
  return Object.freeze({
    map_pin_min_user_turns: envInt("CASTLE_PAL_MAP_PIN_MIN_USER_TURNS", 3),
    map_pin_min_total_turns: envInt("CASTLE_PAL_MAP_PIN_MIN_TOTAL_TURNS", 4),
    continuity_strip_min_user_turns: envInt("CASTLE_PAL_CONTINUITY_STRIP_MIN_USER_TURNS", 1),
    thread_list_min_user_turns: envInt("CASTLE_PAL_THREAD_LIST_MIN_USER_TURNS", 2),
    anchored_min_user_turns: envInt("CASTLE_PAL_ANCHORED_MIN_USER_TURNS", 5)
  });
}

/**
 * @param {import('./lifeContinuityStoreV0.js').LifeContinuityStoreV0} store
 * @param {string} user_id
 * @param {string} thread_id
 */
export function countThreadTurnMetricsV0(store, user_id, thread_id) {
  const recent = store.getRecentTurns(thread_id, { user_id, limit: 256 });
  if (!recent.ok) {
    return { user_turns: 0, assistant_turns: 0, total_turns: 0 };
  }
  let user_turns = 0;
  let assistant_turns = 0;
  for (const t of recent.turns) {
    if (t.role === "user") user_turns += 1;
    else if (t.role === "assistant") assistant_turns += 1;
  }
  const total_turns = recent.turns.length;
  return { user_turns, assistant_turns, total_turns };
}

/**
 * @param {import('./lifeEntityGraphV0.js').LifeEntityGraphV0} graph
 * @param {string} user_id
 * @param {string} castle_id
 */
function castleHasLocation(graph, user_id, castle_id) {
  const edges = graph.listEdgesForUser(user_id, { rel: "located_at", from_id: castle_id });
  if (!edges.edges.length) return false;
  const loc = graph.getNode(edges.edges[0].to_id, { user_id });
  if (!loc.ok || !loc.node.payload) return false;
  const p = loc.node.payload;
  return Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon));
}

/**
 * @param {{ user_turns: number, total_turns: number, has_location: boolean }} metrics
 * @param {ReturnType<typeof readProjectionActivationThresholdsV0>} th
 */
export function computeCastleRevealStageV0(metrics, th = readProjectionActivationThresholdsV0()) {
  if (metrics.total_turns === 0 || metrics.user_turns < 1) return "hidden";
  if (metrics.user_turns >= th.anchored_min_user_turns && metrics.has_location) return "anchored";
  if (
    metrics.user_turns >= th.map_pin_min_user_turns &&
    metrics.total_turns >= th.map_pin_min_total_turns &&
    metrics.has_location
  ) {
    return "revealed";
  }
  if (metrics.user_turns >= th.continuity_strip_min_user_turns) return "hinted";
  return "hidden";
}

/**
 * @param {string} user_id
 * @param {string} castle_id
 * @param {boolean} mapVisibleNow
 */
function markEmergence(user_id, castle_id, mapVisibleNow) {
  if (!mapVisibleNow) return false;
  if (!emergenceSeen.has(user_id)) emergenceSeen.set(user_id, new Set());
  const set = emergenceSeen.get(user_id);
  if (set.has(castle_id)) return false;
  set.add(castle_id);
  return true;
}

/** Test isolation */
export function resetProjectionActivationEmergenceV0() {
  emergenceSeen.clear();
}

/**
 * @param {{
 *   bundle: Record<string, unknown>,
 *   user_id: string,
 *   store?: import('./lifeContinuityStoreV0.js').LifeContinuityStoreV0,
 *   graph?: import('./lifeEntityGraphV0.js').LifeEntityGraphV0,
 *   thresholds?: ReturnType<typeof readProjectionActivationThresholdsV0>
 * }} input
 */
export function activateProjectionBundleV0(input) {
  const user_id = String(input.user_id || "").trim();
  const raw = input.bundle;
  if (!raw || typeof raw !== "object") return { ok: false, code: "invalid_bundle" };

  const store = input.store || getLifeContinuityStoreV0();
  const graph = input.graph || getLifeEntityGraphV0();
  const th = input.thresholds || readProjectionActivationThresholdsV0();

  /** @type {Map<string, { thread_id: string, metrics: ReturnType<typeof countThreadTurnMetricsV0>, has_location: boolean, stage: string }>} */
  const castleState = new Map();

  const castles = graph.listNodesForUser(user_id, { entity_kind: "castle" });
  for (const castle of castles.nodes) {
    const castle_id = String(castle.entity_id);
    const linked = graph.listEdgesForUser(user_id, {
      rel: "linked_thread",
      from_id: castle_id
    });
    const thread_id = String(linked.edges[0]?.payload?.thread_id || "").trim();
    if (!thread_id) continue;
    const metrics = countThreadTurnMetricsV0(store, user_id, thread_id);
    const has_location = castleHasLocation(graph, user_id, castle_id);
    const stage = computeCastleRevealStageV0({ ...metrics, has_location }, th);
    castleState.set(castle_id, { thread_id, metrics, has_location, stage });
  }

  const rawProjections = Array.isArray(raw.projections) ? raw.projections : [];
  /** @type {Record<string, unknown>[]} */
  const projections = [];

  for (const item of rawProjections) {
    if (!item || typeof item !== "object") continue;
    const kind = String(item.projection_kind || "");
    const castle_id = String(item.entity_id || "");
    const state = castleState.get(castle_id);
    const metrics = state?.metrics || { user_turns: 0, total_turns: 0 };
    const stage = state?.stage || "hidden";
    const has_location = state?.has_location ?? false;

    /** @type {Record<string, unknown>} */
    let activation;

    if (kind === "map_pin") {
      const visible =
        stage === "revealed" ||
        stage === "anchored" ||
        (metrics.user_turns >= th.map_pin_min_user_turns &&
          metrics.total_turns >= th.map_pin_min_total_turns &&
          has_location);
      const emergence = markEmergence(user_id, castle_id, visible);
      activation = {
        visible,
        stage: visible ? (stage === "anchored" ? "anchored" : "revealed") : "hinted",
        emergence,
        reason: visible ? "threshold_met" : has_location ? "below_map_pin_user_turns" : "missing_location",
        threshold: {
          user_turns: metrics.user_turns,
          total_turns: metrics.total_turns,
          has_location,
          required_user_turns: th.map_pin_min_user_turns,
          required_total_turns: th.map_pin_min_total_turns
        }
      };
    } else if (kind === "continuity_strip") {
      const visible = metrics.user_turns >= th.continuity_strip_min_user_turns && stage !== "hidden";
      activation = {
        visible,
        stage: visible ? "hinted" : "hidden",
        emergence: false,
        reason: visible ? "strip_threshold_met" : "below_strip_threshold",
        threshold: {
          user_turns: metrics.user_turns,
          required_user_turns: th.continuity_strip_min_user_turns
        }
      };
    } else if (kind === "thread_list") {
      const visible =
        metrics.user_turns >= th.thread_list_min_user_turns ||
        metrics.total_turns >= th.map_pin_min_total_turns;
      activation = {
        visible,
        stage: visible ? "hinted" : "hidden",
        emergence: false,
        reason: visible ? "list_threshold_met" : "below_list_threshold",
        threshold: { user_turns: metrics.user_turns, total_turns: metrics.total_turns }
      };
    } else {
      activation = {
        visible: stage !== "hidden",
        stage,
        emergence: false,
        reason: "passthrough"
      };
    }

    projections.push(
      Object.freeze({
        ...item,
        activation: Object.freeze(activation)
      })
    );
  }

  const castle_reveal = [...castleState.entries()].map(([castle_id, s]) =>
    Object.freeze({
      castle_id,
      thread_id: s.thread_id,
      stage: s.stage,
      metrics: Object.freeze({
        user_turns: s.metrics.user_turns,
        total_turns: s.metrics.total_turns,
        has_location: s.has_location
      })
    })
  );

  const activated = Object.freeze({
    contract_version: raw.contract_version,
    pal_version: PAL_VERSION_V0,
    user_id,
    as_of: new Date().toISOString(),
    castle_reveal,
    projections
  });

  return { ok: true, bundle: activated };
}
