import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { computeGenesisReplayEvolutionV1, GENESIS_REPLAY_EVOLUTION_SCHEMA } from "../genesisReplayEvolutionV1.js";
import { GENESIS_REPLAY_CURVATURE_SERIES_SCHEMA } from "../genesisReplayCurvatureSeriesV1.js";
import { GENESIS_REPLAY_EQUIVALENCE_STABILITY_SCHEMA } from "../genesisReplayEquivalenceStabilityV1.js";
import { GENESIS_REPLAY_TEMPORAL_EMBED_SCHEMA } from "../genesisReplayTemporalEmbeddingV1.js";
import { GENESIS_REPLAY_MANIFOLD_SEGMENT_SCHEMA } from "../genesisReplayManifoldSegmentV1.js";
import { GENESIS_REPLAY_PHASE_ATLAS_SCHEMA } from "../genesisReplayPhaseAtlasV1.js";
import { GENESIS_REPLAY_EQUIVALENCE_TOPOLOGY_SCHEMA } from "../genesisReplayEquivalenceTopologyV1.js";
import { GENESIS_REPLAY_METRIC_STABILITY_SCHEMA } from "../genesisReplayMetricStabilityV1.js";
import { GENESIS_REPLAY_CROSS_MANIFOLD_ALIGNMENT_SCHEMA } from "../genesisReplayCrossManifoldAlignmentV1.js";
import { GENESIS_REPLAY_TEMPORAL_RENORMALIZE_SCHEMA } from "../genesisReplayTemporalRenormalizeV1.js";
import { GENESIS_REPLAY_METRIC_TENSOR_FIELD_SCHEMA } from "../genesisReplayMetricTensorFieldV1.js";
import { GENESIS_REPLAY_STABILITY_COUPLING_SCHEMA } from "../genesisReplayStabilityCouplingV1.js";
import { GENESIS_REPLAY_INVARIANCE_MANIFOLD_SCHEMA } from "../genesisReplayInvarianceManifoldV1.js";
import { GENESIS_REPLAY_FIELD_EVOLUTION_LAW_SCHEMA } from "../genesisReplayFieldEvolutionLawV1.js";
import { publishGenesisContinuityEvent, resetGenesisContinuityStreamHubForTests } from "../genesisContinuityStreamHubV0.js";
import { resetGenesisContinuityEventArchiveForTests } from "../genesisContinuityEventArchiveV0.js";

const prev = {
  disk: process.env.CASTLE_GENESIS_DISK_PERSIST,
  archive: process.env.CASTLE_GENESIS_EVENT_ARCHIVE,
  dataDir: process.env.CASTLE_GENESIS_DATA_DIR
};

async function rmTmp(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    /* noop */
  }
}

test.afterEach(() => {
  if (prev.disk === undefined) delete process.env.CASTLE_GENESIS_DISK_PERSIST;
  else process.env.CASTLE_GENESIS_DISK_PERSIST = prev.disk;
  if (prev.archive === undefined) delete process.env.CASTLE_GENESIS_EVENT_ARCHIVE;
  else process.env.CASTLE_GENESIS_EVENT_ARCHIVE = prev.archive;
  if (prev.dataDir === undefined) delete process.env.CASTLE_GENESIS_DATA_DIR;
  else process.env.CASTLE_GENESIS_DATA_DIR = prev.dataDir;
  resetGenesisContinuityStreamHubForTests();
  resetGenesisContinuityEventArchiveForTests();
});

test("evolution bundles phase, collapse scan, curvature", async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "grev-"));
  t.after(() => rmTmp(tmp));
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_GENESIS_EVENT_ARCHIVE = "1";
  process.env.CASTLE_GENESIS_DATA_DIR = tmp;
  resetGenesisContinuityStreamHubForTests();
  resetGenesisContinuityEventArchiveForTests();

  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "e1", payload: { n: 1 } });
  await new Promise((r) => setTimeout(r, 120));

  const out = await computeGenesisReplayEvolutionV1({
    from: 1,
    to: 40,
    bins: 8,
    collapseWindows: 4,
    includeCheckpoints: false
  });
  assert.equal(out.ok, true);
  assert.equal(out.schema, GENESIS_REPLAY_EVOLUTION_SCHEMA);
  assert.ok(out.phaseRegimeCriticality);
  assert.ok(out.equivalenceCollapses);
  assert.ok(out.causalCurvature);
  assert.ok(out.curvatureSeriesPhase);
  assert.equal(out.curvatureSeriesPhase.schema, GENESIS_REPLAY_CURVATURE_SERIES_SCHEMA);
  assert.ok(Array.isArray(out.curvatureSeriesPhase.series));
  assert.ok(out.equivalenceClassStabilityField);
  assert.equal(out.equivalenceClassStabilityField.schema, GENESIS_REPLAY_EQUIVALENCE_STABILITY_SCHEMA);
  assert.ok(out.temporalEmbeddingProjection);
  assert.equal(out.temporalEmbeddingProjection.schema, GENESIS_REPLAY_TEMPORAL_EMBED_SCHEMA);
  assert.ok(Array.isArray(out.temporalEmbeddingProjection.points));
  assert.ok(out.manifoldSegmentation);
  assert.equal(out.manifoldSegmentation.schema, GENESIS_REPLAY_MANIFOLD_SEGMENT_SCHEMA);
  assert.ok(out.curvatureCriticalPhaseAtlas);
  assert.equal(out.curvatureCriticalPhaseAtlas.schema, GENESIS_REPLAY_PHASE_ATLAS_SCHEMA);
  assert.ok(Array.isArray(out.curvatureCriticalPhaseAtlas.cells));
  assert.ok(out.equivalenceTopologyGraph);
  assert.equal(out.equivalenceTopologyGraph.schema, GENESIS_REPLAY_EQUIVALENCE_TOPOLOGY_SCHEMA);
  assert.ok(Array.isArray(out.equivalenceTopologyGraph.nodes));
  assert.ok(Array.isArray(out.equivalenceTopologyGraph.edges));
  assert.ok(out.metricStabilityAxis);
  assert.equal(out.metricStabilityAxis.schema, GENESIS_REPLAY_METRIC_STABILITY_SCHEMA);
  assert.ok(typeof out.metricStabilityAxis.metricStabilityScore === "number");
  assert.ok(out.crossManifoldAlignment);
  assert.equal(out.crossManifoldAlignment.schema, GENESIS_REPLAY_CROSS_MANIFOLD_ALIGNMENT_SCHEMA);
  assert.ok(Array.isArray(out.crossManifoldAlignment.pairwiseAlignments));
  assert.ok(out.temporalRenormalizationAxis);
  assert.equal(out.temporalRenormalizationAxis.schema, GENESIS_REPLAY_TEMPORAL_RENORMALIZE_SCHEMA);
  assert.ok(typeof out.temporalRenormalizationAxis.manifoldInvarianceScore === "number");
  assert.ok(out.metricTensorField);
  assert.equal(out.metricTensorField.schema, GENESIS_REPLAY_METRIC_TENSOR_FIELD_SCHEMA);
  assert.ok(Array.isArray(out.metricTensorField.tensor));
  assert.equal(out.metricTensorField.tensor.length, 3);
  assert.ok(out.stabilityCouplingAxis);
  assert.equal(out.stabilityCouplingAxis.schema, GENESIS_REPLAY_STABILITY_COUPLING_SCHEMA);
  assert.ok(typeof out.stabilityCouplingAxis.couplingScore === "number");
  assert.ok(out.invarianceManifoldAxis);
  assert.equal(out.invarianceManifoldAxis.schema, GENESIS_REPLAY_INVARIANCE_MANIFOLD_SCHEMA);
  assert.ok(Array.isArray(out.invarianceManifoldAxis.safeGenerators));
  assert.ok(typeof out.invarianceManifoldAxis.invarianceBreadthScore === "number");
  assert.ok(out.fieldEvolutionLaw);
  assert.equal(out.fieldEvolutionLaw.schema, GENESIS_REPLAY_FIELD_EVOLUTION_LAW_SCHEMA);
  assert.ok(typeof out.fieldEvolutionLaw.windowSampleCount === "number");
  assert.ok(Array.isArray(out.fieldEvolutionLaw.lawTags));
});
