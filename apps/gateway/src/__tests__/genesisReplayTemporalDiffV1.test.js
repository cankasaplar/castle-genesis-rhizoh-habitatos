import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { computeGenesisReplayTemporalDiffV1, GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA } from "../genesisReplayTemporalDiffV1.js";
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

test("computeGenesisReplayTemporalDiffV1 rejects bad range", async () => {
  const d = await computeGenesisReplayTemporalDiffV1({ from: 1, to: 0 });
  assert.equal(d.ok, false);
});

test("temporal diff: ring and archive overlap with no payload divergence", async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "grtd-"));
  t.after(() => rmTmp(tmp));
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_GENESIS_EVENT_ARCHIVE = "1";
  process.env.CASTLE_GENESIS_DATA_DIR = tmp;
  resetGenesisContinuityStreamHubForTests();
  resetGenesisContinuityEventArchiveForTests();

  publishGenesisContinuityEvent({ type: "LedgerAdvanced", id: "L1", payload: { delta: 1 } });
  await new Promise((r) => setTimeout(r, 120));

  const d = await computeGenesisReplayTemporalDiffV1({ from: 1, to: 20 });
  assert.equal(d.ok, true);
  assert.equal(d.schema, GENESIS_REPLAY_TEMPORAL_DIFF_SCHEMA);
  assert.equal(d.counts.contentMismatch, 0);
  assert.equal(d.signals.ringArchivePayloadAligned, true);
  assert.ok(d.counts.overlap >= 1);
});
