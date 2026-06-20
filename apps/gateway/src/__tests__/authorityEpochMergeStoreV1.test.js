import test from "node:test";
import assert from "node:assert/strict";
import {
  assimilateAuthorityEpochMergeV1,
  computeMergedEpochIdV1,
  resetAuthorityEpochMergeStoreForTestV1
} from "../authorityEpochMergeStoreV1.js";

test("computeMergedEpochId is commutative", () => {
  const a = computeMergedEpochIdV1("hepoch_a", "hepoch_b");
  const b = computeMergedEpochIdV1("hepoch_b", "hepoch_a");
  assert.equal(a, b);
  assert.match(a, /^h[0-9a-f]{8}$/);
});

test("assimilate records merge without deleting epoch chains", () => {
  resetAuthorityEpochMergeStoreForTestV1();
  const r = assimilateAuthorityEpochMergeV1("subj-merge", {
    sourceEpoch: "hepoch_client",
    targetEpoch: "hepoch_gateway",
    clientHead: "hclient01",
    gatewayHead: "hgateway1",
    divergence: "soft_drift",
    strategy: "causal_assimilation"
  });
  assert.equal(r.ok, true);
  assert.equal(r.mergeEvent.sourceEpoch, "hepoch_client");
  assert.equal(r.mergeEvent.targetEpoch, "hepoch_gateway");
  assert.equal(r.mergeEvent.mergeStrategy, "causal_assimilation");
  assert.equal(r.mergeEvent.resolution.rule, "preserve_both_histories");
  assert.equal(r.mergeEvent.output.canonicalPointer, "gateway_witness_extended");
  assert.equal(r.mergeEvent.output.clientPointer, "client_rebased_chain");
  assert.ok(r.mergeEvent.output.mergedEpochId);
});

test("rejects unsupported merge strategy", () => {
  resetAuthorityEpochMergeStoreForTestV1();
  const r = assimilateAuthorityEpochMergeV1("subj-bad", {
    sourceEpoch: "ha",
    targetEpoch: "hb",
    strategy: "override_client"
  });
  assert.equal(r.ok, false);
  assert.equal(r.error, "unsupported_merge_strategy");
});

test("requires source and target epochs", () => {
  resetAuthorityEpochMergeStoreForTestV1();
  const r = assimilateAuthorityEpochMergeV1("subj-empty", { sourceEpoch: "ha" });
  assert.equal(r.ok, false);
  assert.equal(r.error, "source_and_target_epoch_required");
});
