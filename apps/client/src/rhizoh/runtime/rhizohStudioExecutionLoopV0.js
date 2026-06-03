/**
 * Studio Execution Loop v0 — episodic world engine (B1).
 * MCIB/CCF/ECC collapse → RAR → Studio pack → WAL → RSBL → SSL → SCR.
 * @see docs/RHIZOH_STUDIO_EXECUTION_LOOP_V0.md
 */

import { registerRhizohArtifactFromContinuityStackV0 } from "./rhizohArtifactRegistryV0.js";
import { publishRhizohSurfaceStackV0 } from "./rhizohSurfaceStackPublishV0.js";
import { buildStudioOutputPackV0, publishStudioOutputPackBuiltV0 } from "./rhizohStudioOutputPackV0.js";
import {
  appendWorldActionLogEntryV0,
  buildWorldActionLogEntryV0
} from "./rhizohWorldActionLogV0.js";
import { readLastT0PresenceFrameV0 } from "./rhizohT0UnifiedPresenceFrameV0.js";
import { tickPetCitizenFromWorldStackV0 } from "./rhizohPetCitizenRuntimeV0.js";
import { publishStudioProductionOrganismV0 } from "./rhizohStudioProductionOrganismV0.js";
import { publishCastleProjectionV0 } from "./rhizohCastleProjectionLayerV0.js";
import { tickMultiInhabitantCoPresenceV0 } from "./rhizohMultiInhabitantCoPresenceV0.js";
import { publishStudioCastleMappingV0 } from "./rhizohStudioCastleMappingV0.js";
import {
  publishCastleCoherenceHardeningV0,
  runCastleCoherenceStressHarnessV0
} from "./rhizohCastleCoherenceHardeningV0.js";
import { evaluateStudioPerceptualLockV0 } from "./rhizohStudioPerceptualLockV0.js";
import {
  beginOrganismRhythmCycleV0,
  markOrganismLayerPhaseV0,
  publishOrganismStabilizationV0
} from "./rhizohOrganismStabilizationV0.js";

export const STUDIO_EXECUTION_LOOP_SCHEMA_V0 = "castle.rhizoh.studio_execution_loop.v0";

export const RHIZOH_STUDIO_EXECUTION_LOOP_EVENT_V0 = "rhizoh:studio-execution-loop-v0";

/** @type {ReturnType<typeof runStudioExecutionLoopV0> | null} */
let lastRun = null;

/**
 * @param {ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0>} ecc
 */
function snapshotT0FrameV0(ecc, frame) {
  const f = frame || readLastT0PresenceFrameV0();
  if (!f) return Object.freeze({});
  return Object.freeze({
    schema: f.schema,
    coherenceId: f.coherenceId,
    masterNowMs: f.masterNowMs,
    temporalPhase: f.temporalPhase,
    breathe01: f.breathe01,
    stateKey: f.stateKey,
    transitionProgress01: f.transitionProgress01,
    stream_coherence_id: ecc?.stream_coherence_id || null,
    continuity_line: ecc?.continuity_line || null
  });
}

/**
 * @param {object} cognitive
 */
function snapshotRcalV0(cognitive) {
  const inertia = cognitive?.attention_inertia;
  const mcib = inertia?.mcib;
  const ccf = inertia?.ccf;
  const topo =
    typeof window !== "undefined" ? window.__rhizoh?.rcalCrystalTopology : null;

  return Object.freeze({
    topology_present: Boolean(topo),
    focus_lock_active: topo?.nodes?.some?.((n) => n.role === "focus_lock" && n.active) ?? null,
    mcib_superposition01: mcib?.superposition01 ?? null,
    mcib_cause_count: mcib?.causes?.length || 0,
    ccf_collapse_mode: ccf?.collapse_mode || null,
    experiential_now_id: ccf?.experiential_now_id || null
  });
}

/**
 * @param {{
 *   ecc: ReturnType<import("./rhizohExperienceContinuityCompilerV0.js").compileExperienceContinuityV0>,
 *   frame?: ReturnType<typeof readLastT0PresenceFrameV0>,
 *   resl?: object | null,
 *   cognitive?: object | null,
 *   artifactOpts?: { visibility?: string, surfaces?: string[] }
 * }} ctx
 */
export function runStudioExecutionLoopV0(ctx) {
  const ecc = ctx?.ecc;
  if (!ecc) return null;

  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const frame = ctx.frame || rh.presenceFrame || readLastT0PresenceFrameV0();
  const resl = ctx.resl ?? rh.reslPresentation ?? null;
  const cognitive = ctx.cognitive ?? rh.cognitiveAttention ?? null;

  const heartbeat = beginOrganismRhythmCycleV0(frame);
  markOrganismLayerPhaseV0("scr_tick", frame?.masterNowMs);

  const artifact = registerRhizohArtifactFromContinuityStackV0(ecc, ctx.artifactOpts || {});
  publishRhizohSurfaceStackV0(frame, resl, ecc);
  markOrganismLayerPhaseV0("scr_publish", frame?.masterNowMs);
  const bindings =
    typeof window !== "undefined" ? window.__rhizoh?.surfaceBindings : null;

  const packDraft = buildStudioOutputPackV0(artifact, { bindings, frame });
  const t0Snap = snapshotT0FrameV0(ecc, frame);
  const rcalSnap = snapshotRcalV0(cognitive);

  const petCitizen = tickPetCitizenFromWorldStackV0({
    frame,
    cognitive,
    wal_entry_id: null
  });
  markOrganismLayerPhaseV0("pet_citizen_tick", frame?.masterNowMs);

  const walEntry = appendWorldActionLogEntryV0(
    buildWorldActionLogEntryV0({
      atMs: Number(ecc.atMs) || Date.now(),
      t0_frame: t0Snap,
      rcal: rcalSnap,
      surface_bindings: bindings,
      artifact_id: artifact.artifact_id,
      pack_id: packDraft.pack_id,
      artifact_kind: artifact.kind,
      lineage: artifact.lineage,
      experiential_now_id: artifact.lineage?.experiential_now_id,
      stream_coherence_id: ecc.stream_coherence_id,
      pet_citizen: Object.freeze({
        inhabited: petCitizen.inhabited,
        seq: petCitizen.seq,
        position: petCitizen.position,
        validates_scr: petCitizen.validates_scr,
        cartographic: petCitizen.spatial?.cartographic || null
      })
    })
  );
  if (!walEntry?.entry_id) {
    return Object.freeze({
      schema: STUDIO_EXECUTION_LOOP_SCHEMA_V0,
      atMs: Number(ecc.atMs) || Date.now(),
      ok: false,
      code: "world_write_frozen",
      stages: Object.freeze(["world_write_frozen"])
    });
  }
  markOrganismLayerPhaseV0("wal_append", walEntry.atMs);

  if (petCitizen.inhabited) {
    tickPetCitizenFromWorldStackV0({
      frame,
      cognitive,
      wal_entry_id: walEntry.entry_id
    });
  }

  const pack = Object.freeze({
    ...packDraft,
    lived_state: Object.freeze({
      ...packDraft.lived_state,
      persistence:
        (typeof window !== "undefined" &&
          window.__rhizoh?.worldWalPersistence?.persistence) ||
        "wal_v0",
      wal_entry_id: walEntry.entry_id,
      episode_seq: walEntry.episode_seq
    })
  });

  publishStudioOutputPackBuiltV0(pack);
  markOrganismLayerPhaseV0("studio_pack", walEntry.atMs);

  const result = Object.freeze({
    schema: STUDIO_EXECUTION_LOOP_SCHEMA_V0,
    atMs: walEntry.atMs,
    stages: Object.freeze([
      "mcib_snapshot",
      "ccf_collapse",
      "ecc_finalize",
      "rar_artifact",
      "studio_pack",
      "wal_append",
      "rsbl_bind",
      "ssl_enforce",
      "scr_publish",
      "pet_citizen_tick",
      "studio_production_organism",
      "castle_projection",
      "multi_inhabitant_co_presence",
      "studio_castle_mapping",
      "castle_coherence_hardening",
      "studio_perceptual_lock",
      "organism_stabilization"
    ]),
    artifact_id: artifact.artifact_id,
    pack_id: pack.pack_id,
    wal_entry_id: walEntry.entry_id,
    episode_seq: walEntry.episode_seq,
    coherence_id: bindings?.coherence_id || t0Snap.coherenceId,
    pet_inhabited: petCitizen.inhabited === true
  });
  lastRun = result;
  publishStudioProductionOrganismV0({ run: result });
  publishCastleProjectionV0();
  markOrganismLayerPhaseV0("castle_projection", heartbeat.masterNowMs);
  tickMultiInhabitantCoPresenceV0({ frame, cognitive });
  markOrganismLayerPhaseV0("co_presence", heartbeat.masterNowMs);
  publishStudioCastleMappingV0();
  markOrganismLayerPhaseV0("studio_castle_mapping", heartbeat.masterNowMs);
  publishCastleCoherenceHardeningV0({ frame });
  markOrganismLayerPhaseV0("icl_verify", heartbeat.masterNowMs);
  runCastleCoherenceStressHarnessV0({ frame });
  evaluateStudioPerceptualLockV0({ frame });
  publishOrganismStabilizationV0({ heartbeat, frame, run: result });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_STUDIO_EXECUTION_LOOP_EVENT_V0, {
          detail: Object.freeze({ run: result, pack, walEntry })
        })
      );
    } catch {
      /* noop */
    }
  }
  return result;
}

export function readLastStudioExecutionRunV0() {
  return lastRun;
}

export function resetRhizohStudioExecutionLoopForTestV0() {
  lastRun = null;
}
