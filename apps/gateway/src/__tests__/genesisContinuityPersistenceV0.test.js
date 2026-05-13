import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  appendGenesisCheckpointLogLineV0,
  hydrateGenesisCheckpointLogFromDiskV0,
  genesisContinuityDiskPersistEnabled
} from "../genesisContinuityPersistenceV0.js";
import { hydrateGenesisContinuityPersistenceBootV0 } from "../genesisContinuityHydrateBootV0.js";
import {
  materializeGenesisCheckpointForTests,
  resetGenesisCheckpointStateForTests,
  getLatestGenesisSignedCheckpoint,
  applyGenesisCheckpointHydrationV0
} from "../genesisContinuityCheckpointV0.js";
import {
  getGenesisContinuitySeq,
  rehydrateGenesisContinuitySeqFromBootV0,
  resetGenesisContinuityStreamHubForTests
} from "../genesisContinuityStreamHubV0.js";

function minimalSurface(overrides = {}) {
  return {
    replayFingerprint: { hex: "bb".repeat(32), short: "bb22" },
    epistemicLedger: { entriesPersistedTotal: 1 },
    replay: { alignment: "ok", divergenceTotal: 0 },
    infra: { status: "healthy" },
    gateway: { test: true },
    ...overrides
  };
}

test("genesisContinuityDiskPersistEnabled is false unless CASTLE_GENESIS_DISK_PERSIST=1", () => {
  const prev = process.env.CASTLE_GENESIS_DISK_PERSIST;
  delete process.env.CASTLE_GENESIS_DISK_PERSIST;
  assert.equal(genesisContinuityDiskPersistEnabled(), false);
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  assert.equal(genesisContinuityDiskPersistEnabled(), true);
  if (prev === undefined) delete process.env.CASTLE_GENESIS_DISK_PERSIST;
  else process.env.CASTLE_GENESIS_DISK_PERSIST = prev;
});

test("append + hydrate restores ledger chain and latest checkpoint", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "castle-genesis-persist-"));
  const prevDir = process.env.CASTLE_GENESIS_DATA_DIR;
  const prevDisk = process.env.CASTLE_GENESIS_DISK_PERSIST;
  const prevSecret = process.env.CASTLE_EPISTEMIC_SEAL_SECRET;
  process.env.CASTLE_GENESIS_DATA_DIR = dir;
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_EPISTEMIC_SEAL_SECRET = "persist_test_secret";

  try {
    resetGenesisCheckpointStateForTests();
    resetGenesisContinuityStreamHubForTests();

    const cp1 = materializeGenesisCheckpointForTests(16, minimalSurface());
    assert.ok(cp1);
    await appendGenesisCheckpointLogLineV0(cp1);
    const cp2 = materializeGenesisCheckpointForTests(32, minimalSurface());
    assert.ok(cp2);
    await appendGenesisCheckpointLogLineV0(cp2);

    resetGenesisCheckpointStateForTests();
    assert.equal(getLatestGenesisSignedCheckpoint(), null);

    const h = await hydrateGenesisCheckpointLogFromDiskV0();
    assert.equal(h.ok, true);
    assert.equal(h.linesApplied, 2);
    assert.equal(h.maxSeqCommitted, 32);
    assert.ok(h.ledgerHeadHex);
    assert.ok(h.latestCp);
    applyGenesisCheckpointHydrationV0(h.ledgerHeadHex, h.latestCp);
    const latest = getLatestGenesisSignedCheckpoint();
    assert.ok(latest);
    assert.equal(latest.seqCommittedThrough, 32);
    assert.equal(latest.ledgerRoot, cp2.ledgerRoot);
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

test("hydrateGenesisContinuityPersistenceBootV0 applies seq floor from head + checkpoint", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "castle-genesis-boot-"));
  const prevDir = process.env.CASTLE_GENESIS_DATA_DIR;
  const prevDisk = process.env.CASTLE_GENESIS_DISK_PERSIST;
  const prevSecret = process.env.CASTLE_EPISTEMIC_SEAL_SECRET;
  process.env.CASTLE_GENESIS_DATA_DIR = dir;
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_EPISTEMIC_SEAL_SECRET = "persist_boot_secret";

  try {
    resetGenesisCheckpointStateForTests();
    resetGenesisContinuityStreamHubForTests();

    const cp = materializeGenesisCheckpointForTests(16, minimalSurface());
    assert.ok(cp);
    await appendGenesisCheckpointLogLineV0(cp);

    await fs.writeFile(
      path.join(dir, "genesis-continuity-head.json"),
      JSON.stringify({ recordSchema: "castle.genesis.continuity_head.v0", lastContinuitySeq: 99 }),
      "utf8"
    );

    resetGenesisCheckpointStateForTests();
    resetGenesisContinuityStreamHubForTests();
    assert.equal(getGenesisContinuitySeq(), 0);

    const boot = await hydrateGenesisContinuityPersistenceBootV0();
    assert.equal(boot.ok, true);
    assert.equal(getGenesisContinuitySeq(), 99);
    assert.equal(getLatestGenesisSignedCheckpoint()?.seqCommittedThrough, 16);

    rehydrateGenesisContinuitySeqFromBootV0(5);
    assert.equal(getGenesisContinuitySeq(), 99);
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
