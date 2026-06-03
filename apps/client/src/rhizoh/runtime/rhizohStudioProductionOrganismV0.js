/**
 * Studio Production Organism v0 — world as single lived + produced surface.
 * Unifies pack, WAL episode, pet actor, SCR surfaces (gesture / memory / spatial truth).
 * @see docs/RHIZOH_STUDIO_PRODUCTION_ORGANISM_V0.md
 */

import { RSBL_SURFACE_ID_V0 } from "./rhizohSurfaceBindingLayerV0.js";
import { SSL_SURFACE_ID_V0 } from "./rhizohSurfaceSingularityLayerV0.js";
import { readCitizenProjectionV0 } from "./rhizohSurfaceCitizenshipRuntimeV0.js";
import { readPetCitizenV0 } from "./rhizohPetCitizenRuntimeV0.js";
import { readLastStudioOutputPackV0 } from "./rhizohStudioOutputPackV0.js";
import {
  STUDIO_ORGANISM_SURFACE_ROLE_V0,
  STUDIO_ORGANISM_UNITY_V0
} from "./rhizohStudioOrganismSurfaceRolesV0.js";
import { PET_CESIUM_ENTITY_ID_V0 } from "../spatial/rhizohPetCesiumSpatialBindingV0.js";

export const STUDIO_PRODUCTION_ORGANISM_SCHEMA_V0 =
  "castle.rhizoh.studio_production_organism.v0";

export const RHIZOH_STUDIO_PRODUCTION_ORGANISM_EVENT_V0 =
  "rhizoh:studio-production-organism-v0";

/** @type {ReturnType<typeof buildStudioProductionOrganismV0> | null} */
let lastOrganism = null;

function readRhizohWindowV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {{ run?: { wal_entry_id?: string, episode_seq?: number, coherence_id?: string, atMs?: number } | null }} [ctx]
 */
export function buildStudioProductionOrganismV0(ctx = {}) {
  const rh = readRhizohWindowV0();
  const pack = rh.studioOutputPack || readLastStudioOutputPackV0();
  const episode = rh.worldEpisode || null;
  const pet = readPetCitizenV0() || rh.petCitizen || null;
  const spatial = rh.petSpatialBinding || null;
  const run = ctx.run ?? null;

  const capProjection = readCitizenProjectionV0(RSBL_SURFACE_ID_V0.CAP_WHEEL);
  const drawerProjection = readCitizenProjectionV0(SSL_SURFACE_ID_V0.UI_DRAWER);
  const studioProjection = readCitizenProjectionV0(SSL_SURFACE_ID_V0.STUDIO);
  const cesiumProjection = readCitizenProjectionV0(RSBL_SURFACE_ID_V0.CESIUM);

  const atMs = Number(pack?.atMs) || Number(run?.atMs) || Date.now();

  return Object.freeze({
    schema: STUDIO_PRODUCTION_ORGANISM_SCHEMA_V0,
    unity: STUDIO_ORGANISM_UNITY_V0,
    atMs,
    run_id: run?.wal_entry_id || episode?.wal_entry_id || null,
    episode_seq: episode?.current_seq ?? pack?.lived_state?.episode_seq ?? run?.episode_seq ?? null,
    coherence_id:
      pack?.lived_state?.coherence_id ||
      studioProjection?.coherence_id ||
      run?.coherence_id ||
      null,
    world_identity_id:
      rh.worldIdentity?.world_identity_id ||
      rh.worldWalPersistence?.world_identity_id ||
      null,
    castle_node_id: rh.castleProjection?.castle_node_id || null,
    roles: Object.freeze({
      [RSBL_SURFACE_ID_V0.CAP_WHEEL]: STUDIO_ORGANISM_SURFACE_ROLE_V0.CAP_WHEEL,
      [SSL_SURFACE_ID_V0.UI_DRAWER]: STUDIO_ORGANISM_SURFACE_ROLE_V0.UI_DRAWER,
      [RSBL_SURFACE_ID_V0.CESIUM]: STUDIO_ORGANISM_SURFACE_ROLE_V0.CESIUM,
      pet: STUDIO_ORGANISM_SURFACE_ROLE_V0.PET,
      [SSL_SURFACE_ID_V0.STUDIO]: STUDIO_ORGANISM_SURFACE_ROLE_V0.STUDIO_PANEL
    }),
    memory_organ: Object.freeze({
      surface_id: SSL_SURFACE_ID_V0.UI_DRAWER,
      role: STUDIO_ORGANISM_SURFACE_ROLE_V0.UI_DRAWER,
      wal_entry_id: episode?.wal_entry_id || pack?.lived_state?.wal_entry_id || null,
      episode_seq: episode?.current_seq ?? null,
      pack_id: pack?.pack_id || null,
      artifact_id: pack?.artifact_id || null,
      persistence:
        pack?.lived_state?.persistence ||
        rh.worldWalPersistence?.persistence ||
        "memory_only",
      world_identity_id:
        rh.worldIdentity?.world_identity_id ||
        rh.worldWalPersistence?.world_identity_id ||
        null,
      durable: rh.worldWalPersistence?.durable === true,
      bound: drawerProjection?.bound === true
    }),
    gesture_field: Object.freeze({
      surface_id: RSBL_SURFACE_ID_V0.CAP_WHEEL,
      role: STUDIO_ORGANISM_SURFACE_ROLE_V0.CAP_WHEEL,
      breathe01: capProjection?.breathe01 ?? null,
      intensity01: capProjection?.intensity01 ?? null,
      bound: capProjection?.bound === true
    }),
    spatial_truth: Object.freeze({
      surface_id: RSBL_SURFACE_ID_V0.CESIUM,
      role: STUDIO_ORGANISM_SURFACE_ROLE_V0.CESIUM,
      entity_id: PET_CESIUM_ENTITY_ID_V0,
      cesium_bound: spatial?.cesium_bound === true,
      cartographic: pet?.spatial?.cartographic || spatial?.cartographic || null,
      bound: cesiumProjection?.bound === true
    }),
    pet_actor: Object.freeze({
      role: STUDIO_ORGANISM_SURFACE_ROLE_V0.PET,
      production_aware: true,
      inhabited: pet?.inhabited === true,
      validates_scr: pet?.validates_scr === true,
      seq: pet?.seq ?? null,
      wal_entry_id: pet?.wal_entry_id || episode?.wal_entry_id || null
    }),
    production_surface: Object.freeze({
      surface_id: SSL_SURFACE_ID_V0.STUDIO,
      role: STUDIO_ORGANISM_SURFACE_ROLE_V0.STUDIO_PANEL,
      bound: studioProjection?.bound === true,
      experiential_now_id: pack?.lived_state?.experiential_now_id || null
    })
  });
}

/**
 * @param {{ run?: object | null }} [ctx]
 */
export function publishStudioProductionOrganismV0(ctx = {}) {
  const organism = buildStudioProductionOrganismV0(ctx);
  lastOrganism = organism;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.studioProductionOrganism = organism;
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_STUDIO_PRODUCTION_ORGANISM_EVENT_V0, {
          detail: Object.freeze({ organism })
        })
      );
    } catch {
      /* noop */
    }
  }
  return organism;
}

export function readStudioProductionOrganismV0() {
  return (
    lastOrganism ||
    (typeof window !== "undefined" ? window.__rhizoh?.studioProductionOrganism : null) ||
    null
  );
}

export function resetRhizohStudioProductionOrganismForTestV0() {
  lastOrganism = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.studioProductionOrganism;
  }
}
