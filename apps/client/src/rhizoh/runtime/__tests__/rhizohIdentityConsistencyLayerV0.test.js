import { describe, it, expect, beforeEach } from "vitest";
import { buildT0UnifiedPresenceFrameV0 } from "../rhizohT0UnifiedPresenceFrameV0.js";
import { compileExperienceContinuityV0 } from "../rhizohExperienceContinuityCompilerV0.js";
import { runStudioExecutionLoopV0, resetRhizohStudioExecutionLoopForTestV0 } from "../rhizohStudioExecutionLoopV0.js";
import { resetRhizohWorldActionLogForTestV0, getLastWorldActionLogEntryV0 } from "../rhizohWorldActionLogV0.js";
import { resetRhizohArtifactRegistryForTestV0 } from "../rhizohArtifactRegistryV0.js";
import { resetRhizohSurfaceBindingsForTestV0 } from "../rhizohSurfaceBindingLayerV0.js";
import { resetRhizohSurfaceSingularityForTestV0 } from "../rhizohSurfaceSingularityLayerV0.js";
import { resetRhizohSurfaceCitizenshipForTestV0 } from "../rhizohSurfaceCitizenshipRuntimeV0.js";
import { resetRhizohStudioOutputPackForTestV0 } from "../rhizohStudioOutputPackV0.js";
import { resetRhizohPetCitizenForTestV0 } from "../rhizohPetCitizenRuntimeV0.js";
import { resetRhizohWorldReplayForTestV0 } from "../rhizohWorldReplayV0.js";
import {
  createInMemoryWorldWalIdbBackendV0,
  __setWorldWalIdbBackendForTestV0,
  __resetWorldWalIdbForTestV0
} from "../rhizohWorldActionLogIdbV0.js";
import {
  persistWorldWalEntryV0,
  resetRhizohWorldWalPersistenceForTestV0
} from "../rhizohWorldWalPersistenceV0.js";
import { foldWorldWalEntryHashV0, publishWorldIdentityV0 } from "../rhizohWorldIdentityV0.js";
import { WAL_HASH_CHAIN_GENESIS_V0 } from "../continuity/walHashChainV0.js";
import {
  classifyWorldDriftV0,
  diffLiveSnapshotVsWalEntryV0,
  ICL_DRIFT_CLASS_V0,
  resetRhizohIdentityConsistencyLayerForTestV0,
  runWorldIdentityConsistencyHarnessAsyncV0,
  runWorldIdentityConsistencyHarnessV0,
  snapshotLiveWorldForConsistencyV0,
  verifyWalChainConsistencyV0
} from "../rhizohIdentityConsistencyLayerV0.js";

describe("rhizohIdentityConsistencyLayerV0", () => {
  beforeEach(() => {
    __resetWorldWalIdbForTestV0();
    __setWorldWalIdbBackendForTestV0(createInMemoryWorldWalIdbBackendV0());
    resetRhizohIdentityConsistencyLayerForTestV0();
    resetRhizohWorldWalPersistenceForTestV0();
    resetRhizohWorldReplayForTestV0();
    resetRhizohStudioExecutionLoopForTestV0();
    resetRhizohWorldActionLogForTestV0();
    resetRhizohArtifactRegistryForTestV0();
    resetRhizohSurfaceBindingsForTestV0();
    resetRhizohSurfaceSingularityForTestV0();
    resetRhizohSurfaceCitizenshipForTestV0();
    resetRhizohStudioOutputPackForTestV0();
    resetRhizohPetCitizenForTestV0();
    window.__rhizoh = {
      cognitiveAttention: {
        attention_inertia: {
          mcib: { causes: [{ id: "a" }], superposition01: 0.2 },
          ccf: { experiential_now_id: "en_icl", collapse_mode: "singular" }
        }
      }
    };
  });

  async function runEpisode() {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true, intensity01: 0.7 }, transitionFeel: {} },
      null,
      1_700_000_020_000
    );
    window.__rhizoh.presenceFrame = frame;
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true },
      resl: { orbModulation: { breathe: true } },
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_020_000
    });
    runStudioExecutionLoopV0({ ecc, frame });
    const entry = getLastWorldActionLogEntryV0();
    await persistWorldWalEntryV0(entry);
    return { frame, entry };
  }

  it("proves same_world when live, WAL, and replay align", async () => {
    const { entry } = await runEpisode();
    const live = snapshotLiveWorldForConsistencyV0();
    const report = await runWorldIdentityConsistencyHarnessAsyncV0({
      entryId: entry.entry_id,
      liveSnapshot: live
    });

    expect(report.ok).toBe(true);
    expect(report.equivalence.replay_matches_wal).toBe(true);
    expect(report.drift.drift_class).not.toBe(ICL_DRIFT_CLASS_V0.IDENTITY_BREAK);
    expect(window.__rhizoh.worldIdentityConsistency?.ok).toBe(true);
  });

  it("classifies identity_break on tampered chain link", async () => {
    const { entry } = await runEpisode();
    const tampered = Object.freeze({
      ...entry,
      identity_link: Object.freeze({
        chain_head_hash: "hdeadbeef",
        world_identity_id: "world_id_dead",
        identity_version: 99
      })
    });

    const chain = verifyWalChainConsistencyV0([tampered]);
    expect(chain.ok).toBe(false);

    const drift = classifyWorldDriftV0({
      identityCheck: { drift: true, ok: false },
      chain,
      liveVsWal: { ok: true, mismatches: [] },
      replayVsWal: { ok: true, mismatches: [] }
    });
    expect(drift.drift_class).toBe(ICL_DRIFT_CLASS_V0.IDENTITY_BREAK);
  });

  it("classifies structural drift on coherence mismatch", async () => {
    const { entry, frame } = await runEpisode();
    const live = snapshotLiveWorldForConsistencyV0();
    const diff = diffLiveSnapshotVsWalEntryV0(
      Object.freeze({ ...live, coherence_id: "wrong_coherence" }),
      entry
    );
    expect(diff.ok).toBe(false);

    const drift = classifyWorldDriftV0({
      identityCheck: { drift: false, ok: true },
      chain: { ok: true },
      liveVsWal: diff,
      replayVsWal: diff
    });
    expect(drift.drift_class).toBe(ICL_DRIFT_CLASS_V0.STRUCTURAL);

    expect(frame.coherenceId).toBeTruthy();
    publishWorldIdentityV0({
      schema: "castle.rhizoh.world_identity.v0",
      world_identity_id: "world_id_test",
      identity_version: 1,
      chain_head_hash: foldWorldWalEntryHashV0(entry, WAL_HASH_CHAIN_GENESIS_V0),
      last_entry_id: entry.entry_id,
      last_episode_seq: entry.episode_seq,
      last_coherence_id: frame.coherenceId,
      experiential_now_id: "en_icl",
      atMs: entry.atMs
    });

    const syncReport = runWorldIdentityConsistencyHarnessV0({
      entryId: entry.entry_id,
      liveSnapshot: live,
      skipReplay: true
    });
    expect(syncReport.equivalence.identity_ok).toBe(true);
  });
});
