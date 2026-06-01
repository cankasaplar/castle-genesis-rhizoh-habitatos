/**
 * L1 → L2 resolver — deterministic binding (no NLP, no embeddings).
 * turn/context → entity registry + graph edges ("traffic" on the city plan).
 * @see docs/RHIZOH_L2_ENTITY_CORE_V0.md
 */

import { getLifeEntityGraphV0 } from "./lifeEntityGraphV0.js";
import { buildProjectionBundleV0 } from "./lifeProjectionBridgeV0.js";
import {
  activateProjectionBundleV0,
  isProjectionActivationEnabledV0,
  PAL_VERSION_V0
} from "./projectionActivationLayerV0.js";

export const RESOLVER_MODE_V0 = "deterministic_context_bind_v0";

export function isLifeEntityResolverEnabledV0() {
  return String(process.env.CASTLE_LIFE_ENTITY_RESOLVER || "").trim() === "1";
}

/**
 * Extract castle/location hints from gateway context — explicit fields only.
 * @param {Record<string, unknown>} safePayload
 */
export function extractEntityHintsFromPayloadV0(safePayload) {
  const ctx =
    safePayload?.context && typeof safePayload.context === "object"
      ? /** @type {Record<string, unknown>} */ (safePayload.context)
      : {};

  const life =
    ctx.life_continuity && typeof ctx.life_continuity === "object"
      ? ctx.life_continuity
      : ctx.life_entity && typeof ctx.life_entity === "object"
        ? ctx.life_entity
        : {};

  const castleBlock =
    ctx.castle && typeof ctx.castle === "object" ? /** @type {Record<string, unknown>} */ (ctx.castle) : {};

  const castle_id = String(
    life.castle_id ||
      life.castleId ||
      ctx.castle_id ||
      ctx.castleId ||
      castleBlock.id ||
      castleBlock.castle_id ||
      ""
  ).trim();

  const castle_label = String(
    life.castle_label || life.castleLabel || castleBlock.label || castleBlock.name || "Castle"
  ).trim();

  const locRaw =
    (life.location && typeof life.location === "object" ? life.location : null) ||
    (castleBlock.location && typeof castleBlock.location === "object" ? castleBlock.location : null) ||
    (ctx.location && typeof ctx.location === "object" ? ctx.location : null);

  /** @type {{ lat?: number, lon?: number, place_name?: string, location_id?: string } | null} */
  let location = null;
  if (locRaw && typeof locRaw === "object") {
    const lat = Number(locRaw.lat ?? locRaw.latitude);
    const lon = Number(locRaw.lon ?? locRaw.longitude ?? locRaw.lng);
    location = {
      lat: Number.isFinite(lat) ? lat : undefined,
      lon: Number.isFinite(lon) ? lon : undefined,
      place_name: String(locRaw.place_name || locRaw.placeName || locRaw.label || "").trim() || undefined,
      location_id: String(locRaw.location_id || locRaw.locationId || "").trim() || undefined
    };
  }

  const user_label = String(
    ctx.display_name ||
      ctx.displayName ||
      (ctx.continuity &&
      typeof ctx.continuity === "object" &&
      ctx.continuity.identity &&
      typeof ctx.continuity.identity === "object"
        ? ctx.continuity.identity.displayName
        : "") ||
      ""
  ).trim();

  return Object.freeze({
    castle_id: castle_id || undefined,
    castle_label: castle_label || "Castle",
    location,
    user_label: user_label || undefined
  });
}

/**
 * @param {{
 *   user_id: string,
 *   thread_id: string,
 *   turn_ids?: string[],
 *   safePayload: Record<string, unknown>,
 *   graph?: import('./lifeEntityGraphV0.js').LifeEntityGraphV0
 * }} input
 */
export function resolveLifeContinuityToEntityGraphV0(input) {
  const user_id = String(input.user_id || "").trim();
  const thread_id = String(input.thread_id || "").trim();
  if (user_id.length < 8) return { ok: false, code: "invalid_user_id" };
  if (!thread_id) return { ok: false, code: "missing_thread_id" };

  const graph = input.graph || getLifeEntityGraphV0();
  const hints = extractEntityHintsFromPayloadV0(input.safePayload);

  const user_entity_id = `usr_${user_id}`.slice(0, 128);
  graph.upsertNode({
    entity_id: user_entity_id,
    entity_kind: "user",
    user_id,
    label: hints.user_label || "User"
  });

  /** @type {string[]} */
  const edges_created = [];
  /** @type {string[]} */
  const nodes_touched = [user_entity_id];

  if (!hints.castle_id) {
    return {
      ok: true,
      mode: RESOLVER_MODE_V0,
      skipped_graph: true,
      reason: "no_castle_hint_in_context",
      nodes_touched,
      edges_created
    };
  }

  const castle_id = hints.castle_id;
  graph.upsertNode({
    entity_id: castle_id,
    entity_kind: "castle",
    user_id,
    label: hints.castle_label
  });
  nodes_touched.push(castle_id);

  graph.upsertEdge({
    user_id,
    rel: "owns",
    from_id: user_entity_id,
    to_id: castle_id
  });
  edges_created.push("owns");

  let location_id = hints.location?.location_id;
  if (hints.location && (hints.location.lat != null || hints.location.lon != null)) {
    if (!location_id) {
      location_id = `loc_${castle_id}`.slice(0, 128);
    }
    graph.upsertNode({
      entity_id: location_id,
      entity_kind: "location",
      user_id,
      label: hints.location.place_name || hints.castle_label,
      payload: {
        lat: hints.location.lat,
        lon: hints.location.lon,
        place_name: hints.location.place_name
      }
    });
    nodes_touched.push(location_id);
    graph.upsertEdge({
      user_id,
      rel: "located_at",
      from_id: castle_id,
      to_id: location_id
    });
    edges_created.push("located_at");
  }

  const memory_ref_id = `mem_${thread_id}`.slice(0, 128);
  graph.upsertNode({
    entity_id: memory_ref_id,
    entity_kind: "memory_ref",
    user_id,
    label: `Thread ${thread_id}`,
    payload: { thread_id, turn_ids: input.turn_ids || [] }
  });
  nodes_touched.push(memory_ref_id);

  graph.upsertEdge({
    user_id,
    rel: "linked_thread",
    from_id: castle_id,
    to_id: memory_ref_id,
    payload: { thread_id }
  });
  edges_created.push("linked_thread");

  for (const turn_id of input.turn_ids || []) {
    graph.upsertEdge({
      user_id,
      rel: "references_turn",
      from_id: memory_ref_id,
      to_id: `trn_${turn_id}`.slice(0, 128),
      payload: { thread_id, turn_id }
    });
    edges_created.push("references_turn");
  }

  return {
    ok: true,
    mode: RESOLVER_MODE_V0,
    castle_id,
    thread_id,
    nodes_touched,
    edges_created: [...new Set(edges_created)]
  };
}

/**
 * Resolve + optional projection bundle for gateway response.
 * @param {Parameters<typeof resolveLifeContinuityToEntityGraphV0>[0] & { attach_projection?: boolean }} input
 */
export function resolveAndProjectLifeContinuityV0(input) {
  const resolved = resolveLifeContinuityToEntityGraphV0(input);
  if (!resolved.ok) return resolved;
  if (!input.attach_projection) return resolved;

  const bundle = buildProjectionBundleV0({
    user_id: input.user_id,
    graph: input.graph
  });
  if (!bundle.ok) return { ...resolved, projection: null };

  if (isProjectionActivationEnabledV0()) {
    const activated = activateProjectionBundleV0({
      bundle: bundle.bundle,
      user_id: input.user_id,
      graph: input.graph
    });
    return {
      ...resolved,
      projection: activated.ok ? activated.bundle : bundle.bundle,
      projection_activation: activated.ok ? PAL_VERSION_V0 : null
    };
  }

  return { ...resolved, projection: bundle.bundle };
}
