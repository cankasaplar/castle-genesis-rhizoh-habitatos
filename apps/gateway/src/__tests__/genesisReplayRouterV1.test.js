import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveGenesisReplayRouterV1, GENESIS_REPLAY_ROUTER_SCHEMA } from "../genesisReplayRouterV1.js";
import { publishGenesisContinuityEvent, resetGenesisContinuityStreamHubForTests, queryGenesisContinuityRingV0 } from "../genesisContinuityStreamHubV0.js";
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

test("resolveGenesisReplayRouterV1 rejects invalid range", async () => {
  const a = await resolveGenesisReplayRouterV1({ from: 0, to: 10 });
  assert.equal(a.ok, false);
  assert.equal(a.error, "invalid_range");
});

test("resolveGenesisReplayRouterV1 merges ring events and dedupes archive overlap", async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "grr-"));
  t.after(() => rmTmp(tmp));
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_GENESIS_EVENT_ARCHIVE = "1";
  process.env.CASTLE_GENESIS_DATA_DIR = tmp;
  resetGenesisContinuityStreamHubForTests();
  resetGenesisContinuityEventArchiveForTests();

  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "a", payload: { n: 1 } });
  publishGenesisContinuityEvent({ type: "SealIssued", id: "b", payload: { x: 1 } });
  await new Promise((r) => setTimeout(r, 120));

  const r = await resolveGenesisReplayRouterV1({ from: 1, to: 99, includeCheckpoints: false });
  assert.equal(r.ok, true);
  assert.equal(r.schema, GENESIS_REPLAY_ROUTER_SCHEMA);
  assert.equal(r.continuityEventCount, 2);
  assert.match(String(r.replayFingerprint || ""), /^[a-f0-9]{64}$/);
  const withSrc = r.continuityEvents.filter((e) => e && typeof e === "object" && "_replaySource" in e);
  assert.equal(withSrc.length, 2);
  assert.equal(r.sources.ring.ok, true);
  assert.equal(r.sources.ring.count, 2);
  assert.equal(r.sources.archive.ok, true);
  assert.ok(r.sources.archive.skippedAsDuplicateOfRing >= 0);
});

test("queryGenesisContinuityRingV0 filters by type", () => {
  resetGenesisContinuityStreamHubForTests();
  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "t1", payload: {} });
  publishGenesisContinuityEvent({ type: "SealIssued", id: "s1", payload: {} });
  const q = queryGenesisContinuityRingV0(1, 10, "TickAdvanced");
  assert.equal(q.ok, true);
  assert.equal(q.events.length, 1);
  assert.equal(String(q.events[0].type), "TickAdvanced");
});
