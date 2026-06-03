/**
 * Studio → Castle mapping v0 — producer organism → ICL-bound shared projection space.
 * @see docs/RHIZOH_STUDIO_CASTLE_MAPPING_V0.md
 */

import { readStudioProductionOrganismV0 } from "./rhizohStudioProductionOrganismV0.js";
import { readCastleProjectionV0 } from "./rhizohCastleProjectionLayerV0.js";
import { readMultiInhabitantCoPresenceV0 } from "./rhizohMultiInhabitantCoPresenceV0.js";
import { STUDIO_ORGANISM_SURFACE_ROLE_V0 } from "./rhizohStudioOrganismSurfaceRolesV0.js";

export const STUDIO_CASTLE_MAPPING_SCHEMA_V0 = "castle.rhizoh.studio_castle_mapping.v0";

export const RHIZOH_STUDIO_CASTLE_MAPPING_EVENT_V0 = "rhizoh:studio-castle-mapping-v0";

/** @type {ReturnType<typeof buildStudioCastleMappingV0> | null} */
let lastMapping = null;

/**
 * @param {ReturnType<typeof readStudioProductionOrganismV0> | null} organism
 * @param {string} studioRole
 */
function isStudioCastleRoleBoundV0(organism, studioRole) {
  const roles = organism?.roles;
  if (!roles || !Object.values(roles).includes(studioRole)) return false;
  if (studioRole === STUDIO_ORGANISM_SURFACE_ROLE_V0.PET) {
    return organism.pet_actor?.inhabited === true;
  }
  return true;
}

export const STUDIO_TO_CASTLE_SURFACE_MAP_V0 = Object.freeze({
  [STUDIO_ORGANISM_SURFACE_ROLE_V0.CAP_WHEEL]: "castle_gesture_overlay",
  [STUDIO_ORGANISM_SURFACE_ROLE_V0.UI_DRAWER]: "castle_memory_panel",
  [STUDIO_ORGANISM_SURFACE_ROLE_V0.CESIUM]: "castle_spatial_truth",
  [STUDIO_ORGANISM_SURFACE_ROLE_V0.PET]: "castle_inhabitant_anchor",
  [STUDIO_ORGANISM_SURFACE_ROLE_V0.STUDIO_PANEL]: "castle_production_room"
});

/**
 * @param {{
 *   organism?: ReturnType<typeof readStudioProductionOrganismV0> | null,
 *   castle?: ReturnType<typeof readCastleProjectionV0> | null,
 *   coPresence?: ReturnType<typeof readMultiInhabitantCoPresenceV0> | null
 * }} [ctx]
 */
export function buildStudioCastleMappingV0(ctx = {}) {
  const organism = ctx.organism ?? readStudioProductionOrganismV0();
  const castle = ctx.castle ?? readCastleProjectionV0();
  const coPresence = ctx.coPresence ?? readMultiInhabitantCoPresenceV0();

  const surfaces = Object.freeze(
    Object.entries(STUDIO_TO_CASTLE_SURFACE_MAP_V0).map(([studioRole, castleSurface]) =>
      Object.freeze({
        studio_role: studioRole,
        castle_surface: castleSurface,
        bound: isStudioCastleRoleBoundV0(organism, studioRole)
      })
    )
  );

  return Object.freeze({
    schema: STUDIO_CASTLE_MAPPING_SCHEMA_V0,
    atMs: Number(organism?.atMs) || Date.now(),
    castle_node_id: castle?.castle_node_id || null,
    world_identity_id: castle?.world_identity_id || organism?.world_identity_id || null,
    episode_seq: organism?.episode_seq ?? castle?.episode_seq ?? null,
    wal_entry_id: organism?.memory_organ?.wal_entry_id || castle?.wal_entry_id || null,
    icl_enforced: castle?.icl_enforced === true,
    producer_to_shared: surfaces,
    co_presence_ok: coPresence?.ok !== false,
    inhabitant_count: coPresence?.inhabitant_count ?? 0,
    pet_actor: organism?.pet_actor || null,
    memory_organ: organism?.memory_organ || null
  });
}

/**
 * @param {object} [ctx]
 */
export function publishStudioCastleMappingV0(ctx = {}) {
  const mapping = buildStudioCastleMappingV0(ctx);
  lastMapping = mapping;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.studioCastleMapping = mapping;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_STUDIO_CASTLE_MAPPING_EVENT_V0, {
          detail: Object.freeze({ mapping })
        })
      );
    } catch {
      /* noop */
    }
  }
  return mapping;
}

export function readStudioCastleMappingV0() {
  return (
    lastMapping ||
    (typeof window !== "undefined" ? window.__rhizoh?.studioCastleMapping : null) ||
    null
  );
}

export function resetRhizohStudioCastleMappingForTestV0() {
  lastMapping = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.studioCastleMapping;
  }
}
