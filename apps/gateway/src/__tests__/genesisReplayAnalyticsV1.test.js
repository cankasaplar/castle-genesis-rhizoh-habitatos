import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { computeGenesisReplayAnalyticsV1 } from "../genesisReplayAnalyticsV1.js";
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

test("analytics bundles topology + stability field", async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "gra-"));
  t.after(() => rmTmp(tmp));
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_GENESIS_EVENT_ARCHIVE = "1";
  process.env.CASTLE_GENESIS_DATA_DIR = tmp;
  resetGenesisContinuityStreamHubForTests();
  resetGenesisContinuityEventArchiveForTests();

  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "t1", payload: { n: 1 } });
  await new Promise((r) => setTimeout(r, 120));

  const out = await computeGenesisReplayAnalyticsV1({ from: 1, to: 30, bins: 4, includeCheckpoints: false });
  assert.equal(out.ok, true);
  assert.ok(out.causalTopology?.nodes?.length >= 1);
  assert.ok(Array.isArray(out.stabilityField?.entropyField));
  assert.equal(typeof out.replayFingerprint, "string");
});
