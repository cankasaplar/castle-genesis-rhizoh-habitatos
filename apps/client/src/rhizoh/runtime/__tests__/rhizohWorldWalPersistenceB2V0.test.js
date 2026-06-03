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
import { resetRhizohStudioProductionOrganismForTestV0 } from "../rhizohStudioProductionOrganismV0.js";
import {
  createInMemoryWorldWalIdbBackendV0,
  __setWorldWalIdbBackendForTestV0,
  __resetWorldWalIdbForTestV0,
  getWorldWalEntryFromIdbV0
} from "../rhizohWorldActionLogIdbV0.js";
import {
  initRhizohWorldWalPersistenceV0,
  persistWorldWalEntryV0,
  readWalPersistenceStatusV0,
  resetRhizohWorldWalPersistenceForTestV0,
  resolveWorldWalEntryV0
} from "../rhizohWorldWalPersistenceV0.js";
import { readWorldIdentityV0 } from "../rhizohWorldIdentityV0.js";
import {
  replayWorldActionLogEntryAsyncV0,
  resetRhizohWorldReplayForTestV0
} from "../rhizohWorldReplayV0.js";

describe("rhizohWorldWalPersistenceB2V0", () => {
  beforeEach(() => {
    __resetWorldWalIdbForTestV0();
    __setWorldWalIdbBackendForTestV0(createInMemoryWorldWalIdbBackendV0());
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
    resetRhizohStudioProductionOrganismForTestV0();
    window.__rhizoh = {
      cognitiveAttention: {
        attention_inertia: {
          mcib: { causes: [{ id: "a" }], superposition01: 0.2 },
          ccf: { experiential_now_id: "en_b2", collapse_mode: "singular" }
        }
      }
    };
  });

  it("persists WAL entry to IDB and advances world identity", async () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true }, transitionFeel: {} },
      null,
      1_700_000_010_000
    );
    window.__rhizoh.presenceFrame = frame;
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true },
      resl: {},
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_010_000
    });
    const run = runStudioExecutionLoopV0({ ecc, frame });
    const entry = getLastWorldActionLogEntryV0();
    await persistWorldWalEntryV0(entry);

    const status = readWalPersistenceStatusV0();
    expect(status.durable).toBe(true);
    expect(status.persistence).toBe("wal_idb_v0");
    expect(readWorldIdentityV0()?.world_identity_id).toMatch(/^world_id_/);

    const idbEntry = await getWorldWalEntryFromIdbV0(run.wal_entry_id);
    expect(idbEntry?.identity_link?.chain_head_hash).toBeTruthy();
  });

  it("hydrates ring from IDB after simulated cold boot", async () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "idle" },
      { orbModulation: {}, transitionFeel: {} },
      null,
      1_700_000_011_000
    );
    window.__rhizoh.presenceFrame = frame;
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true },
      resl: {},
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_011_000
    });
    runStudioExecutionLoopV0({ ecc, frame });
    const entry = getLastWorldActionLogEntryV0();
    await persistWorldWalEntryV0(entry);

    resetRhizohWorldActionLogForTestV0();
    expect(getLastWorldActionLogEntryV0()).toBeNull();

    await initRhizohWorldWalPersistenceV0({ force: true });
    expect(getLastWorldActionLogEntryV0()?.entry_id).toBe(entry.entry_id);
  });

  it("async replay resolves IDB entry with identity check", async () => {
    const frame = buildT0UnifiedPresenceFrameV0(
      { rhizoh_is_present: true, silence_form: "listening", rhizoh_attention: "focused" },
      { orbModulation: { breathe: true }, transitionFeel: {} },
      null,
      1_700_000_012_000
    );
    window.__rhizoh.presenceFrame = frame;
    const ecc = compileExperienceContinuityV0({
      presence: { rhizoh_is_present: true },
      resl: {},
      cognitive: window.__rhizoh.cognitiveAttention,
      nowMs: 1_700_000_012_000
    });
    const run = runStudioExecutionLoopV0({ ecc, frame });
    const entry = getLastWorldActionLogEntryV0();
    await persistWorldWalEntryV0(entry);

    resetRhizohWorldActionLogForTestV0();
    const resolved = await resolveWorldWalEntryV0(run.wal_entry_id);
    expect(resolved?.entry_id).toBe(run.wal_entry_id);

    const replay = await replayWorldActionLogEntryAsyncV0(run.wal_entry_id);
    expect(replay?.identity?.same_world).toBe(true);
    expect(window.__rhizoh.replayMode).toBe(true);
  });
});
