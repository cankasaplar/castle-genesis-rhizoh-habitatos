/**
 * Pet Citizen Runtime v0 — first inhabited non-authoring entity (C).
 * Reads RCAL → RSBL/SCR → WAL lineage; never produces local temporal state.
 * @see docs/RHIZOH_PET_CITIZEN_RUNTIME_V0.md
 */

import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { readCitizenProjectionV0 } from "./rhizohSurfaceCitizenshipRuntimeV0.js";
import { SSL_SURFACE_ID_V0 } from "./rhizohSurfaceSingularityLayerV0.js";
import { projectRcalCrystalTopologyV0, CRYSTAL_NODE_ROLE_V0 } from "./rhizohRcalCrystalTopologyV0.js";
import { buildPetSpatialBindingSnapshotV0 } from "../spatial/rhizohPetSpatialGeoV0.js";
import { STUDIO_ORGANISM_SURFACE_ROLE_V0 } from "./rhizohStudioOrganismSurfaceRolesV0.js";

export const PET_CITIZEN_SCHEMA_V0 = "castle.rhizoh.pet_citizen.v0";

export const RHIZOH_PET_CITIZEN_EVENT_V0 = "rhizoh:pet-citizen-v0";

/** @type {ReturnType<typeof tickPetCitizenFromWorldStackV0> | null} */
let lastPetCitizen = null;

let petSeq = 0;

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

/**
 * World position from RCAL focus_lock + RSBL breathe (not local clock).
 * @param {ReturnType<typeof projectRcalCrystalTopologyV0>} topo
 * @param {ReturnType<typeof readCitizenProjectionV0>} petProjection
 * @param {ReturnType<typeof readLastT0PresenceFrameV0>} frame
 */
function derivePetWorldPositionV0(topo, petProjection, frame) {
  const focus =
    topo?.nodes?.find((n) => n.id === "focus_lock" || n.role === CRYSTAL_NODE_ROLE_V0.FOCUS_LOCK) ||
    null;
  const anchor = topo?.nodes?.find((n) => n.id === "drift_anchor") || null;
  const breathe01 = clamp01(frame?.breathe01 ?? petProjection?.breathe01);
  return Object.freeze({
    x: Number(focus?.x ?? anchor?.x ?? 0),
    y: Number(focus?.y ?? anchor?.y ?? 0),
    z: breathe01 * 0.15,
    world_projection: true,
    focus_label: focus?.label || anchor?.label || null
  });
}

/**
 * @param {{
 *   frame?: ReturnType<typeof readLastT0PresenceFrameV0>,
 *   cognitive?: object | null,
 *   wal_entry_id?: string | null
 * }} [ctx]
 */
export function tickPetCitizenFromWorldStackV0(ctx = {}) {
  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const frame = ctx.frame || rh.presenceFrame || readLastT0PresenceFrameV0();
  const cognitive = ctx.cognitive ?? rh.cognitiveAttention ?? null;
  const petProjection = readCitizenProjectionV0(SSL_SURFACE_ID_V0.PET);
  const topo = rh.rcalCrystalTopology || projectRcalCrystalTopologyV0(cognitive);
  const present =
    frame?.temporalPhase !== "absent" &&
    (rh.presenceState?.rhizoh_is_present !== false || frame?.breathe01 > 0);

  if (!present || !petProjection?.bound) {
    const empty = Object.freeze({
      schema: PET_CITIZEN_SCHEMA_V0,
      pet_id: "pet_citizen_v0",
      seq: petSeq,
      inhabited: false,
      owns_state: false,
      validates_scr: false,
      position: null,
      coherence_id: petProjection?.coherence_id || null
    });
    lastPetCitizen = empty;
    publishPetCitizenV0(empty);
    return empty;
  }

  petSeq += 1;
  const inertia = cognitive?.attention_inertia;
  const position = derivePetWorldPositionV0(topo, petProjection, frame);

  const citizen = Object.freeze({
    schema: PET_CITIZEN_SCHEMA_V0,
    pet_id: "pet_citizen_v0",
    seq: petSeq,
    inhabited: true,
    owns_state: false,
    validates_scr: true,
    position,
    spatial: buildPetSpatialBindingSnapshotV0({ inhabited: true, position, breathe01: clamp01(frame?.breathe01 ?? petProjection?.breathe01), intensity01: clamp01(petProjection?.intensity01 ?? 0.65), coherence_id: petProjection?.coherence_id || frame?.coherenceId || null, masterNowMs: Number(frame?.masterNowMs) || Date.now() }),
    rcal: Object.freeze({
      focus_lock_active: Boolean(
        topo?.nodes?.some((n) => n.role === CRYSTAL_NODE_ROLE_V0.FOCUS_LOCK && n.intensity01 > 0.05)
      ),
      focus_intensity01: Number(
        topo?.nodes?.find((n) => n.id === "focus_lock")?.intensity01 ?? 0
      )
    }),
    mcib_superposition01: inertia?.mcib?.superposition01 ?? null,
    ccf_collapse_mode: inertia?.ccf?.collapse_mode || null,
    experiential_now_id: inertia?.ccf?.experiential_now_id || null,
    breathe01: clamp01(frame?.breathe01 ?? petProjection?.breathe01),
    intensity01: clamp01(petProjection?.intensity01 ?? 0.65),
    coherence_id: petProjection?.coherence_id || frame?.coherenceId || null,
    masterNowMs: Number(frame?.masterNowMs) || Date.now(),
    wal_entry_id: ctx.wal_entry_id || rh.worldEpisode?.wal_entry_id || null,
    episode_seq: rh.worldEpisode?.current_seq ?? null,
    studio_actor: Object.freeze({
      role: STUDIO_ORGANISM_SURFACE_ROLE_V0.PET,
      production_aware: true
    })
  });

  lastPetCitizen = citizen;
  publishPetCitizenV0(citizen);
  return citizen;
}

/**
 * @param {ReturnType<typeof tickPetCitizenFromWorldStackV0>} citizen
 */
function publishPetCitizenV0(citizen) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.petCitizen = citizen;
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_PET_CITIZEN_EVENT_V0, {
        detail: Object.freeze({ citizen })
      })
    );
  } catch {
    /* noop */
  }
}

export function readPetCitizenV0() {
  return (
    lastPetCitizen ||
    (typeof window !== "undefined" ? window.__rhizoh?.petCitizen : null) ||
    null
  );
}

export function readPetCitizenStateV0() {
  const citizen = readPetCitizenV0();
  if (citizen) {
    return Object.freeze({
      bound: true,
      world_projection: citizen.position?.world_projection === true,
      breathe01: clamp01(citizen.breathe01),
      intensity01: clamp01(citizen.intensity01 ?? 0.65),
      coherence_id: citizen.coherence_id ?? null,
      inhabited: citizen.inhabited === true,
      validates_scr: citizen.validates_scr === true,
      owns_state: false
    });
  }
  const p = readCitizenProjectionV0(SSL_SURFACE_ID_V0.PET);
  return Object.freeze({
    bound: p?.bound === true,
    world_projection: p?.world_projection === true,
    breathe01: clamp01(p?.breathe01),
    intensity01: clamp01(p?.intensity01 ?? 0.65),
    coherence_id: p?.coherence_id ?? null,
    inhabited: false,
    validates_scr: false,
    owns_state: false
  });
}

export function resetRhizohPetCitizenForTestV0() {
  lastPetCitizen = null;
  petSeq = 0;
}
