import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  genesisCheckpointQueryBySeqV0,
  genesisCheckpointQueryRangeV0,
  genesisCheckpointQueryLineageV0
} from "../genesisCheckpointQueryV0.js";
import { appendGenesisCheckpointLogLineV0 } from "../genesisContinuityPersistenceV0.js";
import {
  materializeGenesisCheckpointForTests,
  resetGenesisCheckpointStateForTests
} from "../genesisContinuityCheckpointV0.js";
import { resetGenesisContinuityStreamHubForTests } from "../genesisContinuityStreamHubV0.js";

function minimalSurface(overrides = {}) {
  return {
    replayFingerprint: { hex: "cc".repeat(32), short: "cc33" },
    epistemicLedger: { entriesPersistedTotal: 2 },
    replay: { alignment: "ok", divergenceTotal: 0 },
    infra: { status: "healthy" },
    gateway: { test: true },
    ...overrides
  };
}

test("query by-seq / range / lineage are read-only projections over validated log", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "castle-genesis-query-"));
  const prevDir = process.env.CASTLE_GENESIS_DATA_DIR;
  const prevDisk = process.env.CASTLE_GENESIS_DISK_PERSIST;
  const prevSecret = process.env.CASTLE_EPISTEMIC_SEAL_SECRET;
  process.env.CASTLE_GENESIS_DATA_DIR = dir;
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_EPISTEMIC_SEAL_SECRET = "query_test_secret";

  try {
    resetGenesisCheckpointStateForTests();
    resetGenesisContinuityStreamHubForTests();

    const cp16 = materializeGenesisCheckpointForTests(16, minimalSurface());
    const cp32 = materializeGenesisCheckpointForTests(32, minimalSurface());
    assert.ok(cp16 && cp32);
    await appendGenesisCheckpointLogLineV0(cp16);
    await appendGenesisCheckpointLogLineV0(cp32);

    const by = await genesisCheckpointQueryBySeqV0(32);
    assert.equal(by.ok, true);
    assert.equal(by.checkpoint?.seqCommittedThrough, 32);

    const bad = await genesisCheckpointQueryBySeqV0(99);
    assert.equal(bad.ok, false);
    assert.equal(bad.error, "checkpoint_not_found");

    const rg = await genesisCheckpointQueryRangeV0(16, 32);
    assert.equal(rg.ok, true);
    assert.equal(rg.count, 2);

    const lin = await genesisCheckpointQueryLineageV0(20);
    assert.equal(lin.ok, true);
    assert.equal(lin.count, 1);
    assert.equal(lin.checkpoints[0].seqCommittedThrough, 16);
    assert.ok(String(lin.genesisAnchorHex || "").length === 64);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
    if (prevDir === undefined) delete process.env.CASTLE_GENESIS_DATA_DIR;
    else process.env.CASTLE_GENESIS_DATA_DIR = prevDir;
    if (prevDisk === undefined) delete process.env.CASTLE_GENESIS_DISK_PERSIST;
    else process.env.CASTLE_GENESIS_DISK_PERSIST = prevDisk;
    if (prevSecret === undefined) delete process.env.CASTLE_EPISTEMIC_SEAL_SECRET;
    else process.env.CASTLE_EPISTEMIC_SEAL_SECRET = prevSecret;
    resetGenesisCheckpointStateForTests();
    resetGenesisContinuityStreamHubForTests();
  }
});

test("query range rejects oversized span", async () => {
  const out = await genesisCheckpointQueryRangeV0(1, 2000);
  assert.equal(out.ok, false);
  assert.equal(out.error, "range_span_too_large");
});

test("query when CASTLE_GENESIS_DISK_PERSIST=0 returns genesis_ephemeral_mode", async () => {
  const prev = process.env.CASTLE_GENESIS_DISK_PERSIST;
  process.env.CASTLE_GENESIS_DISK_PERSIST = "0";
  try {
    const out = await genesisCheckpointQueryBySeqV0(1);
    assert.equal(out.ok, false);
    assert.equal(out.error, "genesis_ephemeral_mode");
  } finally {
    if (prev === undefined) delete process.env.CASTLE_GENESIS_DISK_PERSIST;
    else process.env.CASTLE_GENESIS_DISK_PERSIST = prev;
  }
});

test("query when disk persist unset returns genesis_disk_query_unavailable", async () => {
  const prev = process.env.CASTLE_GENESIS_DISK_PERSIST;
  delete process.env.CASTLE_GENESIS_DISK_PERSIST;
  try {
    const out = await genesisCheckpointQueryBySeqV0(1);
    assert.equal(out.ok, false);
    assert.equal(out.error, "genesis_disk_query_unavailable");
  } finally {
    if (prev === undefined) delete process.env.CASTLE_GENESIS_DISK_PERSIST;
    else process.env.CASTLE_GENESIS_DISK_PERSIST = prev;
  }
});
