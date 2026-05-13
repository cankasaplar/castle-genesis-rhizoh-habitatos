import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  stableStringifyGenesisReplayV1,
  fingerprintGenesisReplayRouterOutputV1
} from "../genesisReplayDeterminismV1.js";
import { resolveGenesisReplayRouterV1 } from "../genesisReplayRouterV1.js";
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

test("stableStringifyGenesisReplayV1 is key-order invariant", () => {
  const a = stableStringifyGenesisReplayV1({ z: 1, a: { m: 2, b: 3 } });
  const b = stableStringifyGenesisReplayV1({ a: { b: 3, m: 2 }, z: 1 });
  assert.equal(a, b);
});

test("resolveGenesisReplayRouterV1 is fingerprint-stable across immediate double call", async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "grdet-"));
  t.after(() => rmTmp(tmp));
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_GENESIS_EVENT_ARCHIVE = "1";
  process.env.CASTLE_GENESIS_DATA_DIR = tmp;
  resetGenesisContinuityStreamHubForTests();
  resetGenesisContinuityEventArchiveForTests();

  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "x1", payload: { v: 1 } });
  await new Promise((r) => setTimeout(r, 120));

  const r1 = await resolveGenesisReplayRouterV1({ from: 1, to: 50, includeCheckpoints: false });
  const r2 = await resolveGenesisReplayRouterV1({ from: 1, to: 50, includeCheckpoints: false });
  assert.equal(r1.ok, true);
  assert.equal(r2.ok, true);
  const f1 = fingerprintGenesisReplayRouterOutputV1(/** @type {{ continuityEvents: unknown[], checkpoints: unknown[] }} */ (r1));
  const f2 = fingerprintGenesisReplayRouterOutputV1(/** @type {{ continuityEvents: unknown[], checkpoints: unknown[] }} */ (r2));
  assert.equal(f1, f2);
  assert.equal(String(r1.replayFingerprint), f1);
  assert.equal(String(r2.replayFingerprint), f2);
});
