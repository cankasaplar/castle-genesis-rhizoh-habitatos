import test from "node:test";
import assert from "node:assert/strict";
import {
  GENESIS_SIGNED_CHECKPOINT_SCHEMA,
  computeGenesisLedgerRootLinkV0,
  verifyGenesisSignedCheckpointV0,
  materializeGenesisCheckpointForTests,
  resetGenesisCheckpointStateForTests,
  installGenesisCheckpointSurfaceGetter,
  noteGenesisCheckpointSeqCommitted,
  getLatestGenesisSignedCheckpoint,
  checkpointIntervalSeq
} from "../genesisContinuityCheckpointV0.js";

function minimalSurface(overrides = {}) {
  return {
    replayFingerprint: { hex: "aa".repeat(32), short: "aa11" },
    epistemicLedger: { entriesPersistedTotal: 7 },
    replay: { alignment: "no_divergence_signal", divergenceTotal: 0 },
    infra: { status: "healthy" },
    gateway: { test: true },
    ...overrides
  };
}

test("computeGenesisLedgerRootLinkV0 is stable for identical inputs", () => {
  const a = computeGenesisLedgerRootLinkV0("deadbeef", 128, 3, "00ff");
  const b = computeGenesisLedgerRootLinkV0("deadbeef", 128, 3, "00ff");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test("materializeGenesisCheckpointForTests signs and verifies; chains ledgerRoot", () => {
  resetGenesisCheckpointStateForTests();
  const prevSecret = process.env.CASTLE_EPISTEMIC_SEAL_SECRET;
  process.env.CASTLE_EPISTEMIC_SEAL_SECRET = "unit_test_checkpoint_secret";

  try {
    const s = minimalSurface();
    const cp1 = materializeGenesisCheckpointForTests(128, s);
    assert.ok(cp1);
    assert.equal(cp1.schema, GENESIS_SIGNED_CHECKPOINT_SCHEMA);
    assert.equal(cp1.seqCommittedThrough, 128);
    assert.ok(cp1.prevLedgerRoot);
    assert.ok(cp1.ledgerRoot);
    assert.ok(cp1.checkpointHash);
    assert.ok(cp1.signature);
    assert.ok(cp1.canonical);

    const ok1 = verifyGenesisSignedCheckpointV0(
      cp1.canonical,
      process.env.CASTLE_EPISTEMIC_SEAL_SECRET,
      cp1.checkpointHash,
      cp1.signature
    );
    assert.equal(ok1, true);

    const cp2 = materializeGenesisCheckpointForTests(256, minimalSurface({ replay: { alignment: "ok", divergenceTotal: 1 } }));
    assert.ok(cp2);
    assert.equal(cp2.prevLedgerRoot, cp1.ledgerRoot);
    const ok2 = verifyGenesisSignedCheckpointV0(
      cp2.canonical,
      process.env.CASTLE_EPISTEMIC_SEAL_SECRET,
      cp2.checkpointHash,
      cp2.signature
    );
    assert.equal(ok2, true);
  } finally {
    if (prevSecret === undefined) delete process.env.CASTLE_EPISTEMIC_SEAL_SECRET;
    else process.env.CASTLE_EPISTEMIC_SEAL_SECRET = prevSecret;
    resetGenesisCheckpointStateForTests();
  }
});

test("noteGenesisCheckpointSeqCommitted writes latest when interval matches", async () => {
  resetGenesisCheckpointStateForTests();
  const prevSecret = process.env.CASTLE_EPISTEMIC_SEAL_SECRET;
  process.env.CASTLE_EPISTEMIC_SEAL_SECRET = "unit_test_checkpoint_secret_async";
  const prevInterval = process.env.GENESIS_CHECKPOINT_INTERVAL_SEQ;
  process.env.GENESIS_CHECKPOINT_INTERVAL_SEQ = "16";

  try {
    assert.equal(checkpointIntervalSeq(), 16);
    installGenesisCheckpointSurfaceGetter(async () => minimalSurface());
    assert.equal(getLatestGenesisSignedCheckpoint(), null);

    noteGenesisCheckpointSeqCommitted(15);
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(getLatestGenesisSignedCheckpoint(), null);

    noteGenesisCheckpointSeqCommitted(16);
    await new Promise((r) => setTimeout(r, 80));
    const cp = getLatestGenesisSignedCheckpoint();
    assert.ok(cp);
    assert.equal(cp.seqCommittedThrough, 16);
    assert.equal(cp.intervalSeq, 16);
  } finally {
    if (prevSecret === undefined) delete process.env.CASTLE_EPISTEMIC_SEAL_SECRET;
    else process.env.CASTLE_EPISTEMIC_SEAL_SECRET = prevSecret;
    if (prevInterval === undefined) delete process.env.GENESIS_CHECKPOINT_INTERVAL_SEQ;
    else process.env.GENESIS_CHECKPOINT_INTERVAL_SEQ = prevInterval;
    installGenesisCheckpointSurfaceGetter(null);
    resetGenesisCheckpointStateForTests();
  }
});
