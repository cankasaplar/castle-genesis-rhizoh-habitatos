import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  queryGenesisContinuityEventArchiveV0,
  resetGenesisContinuityEventArchiveForTests
} from "../genesisContinuityEventArchiveV0.js";
import { publishGenesisContinuityEvent, resetGenesisContinuityStreamHubForTests } from "../genesisContinuityStreamHubV0.js";

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

test("query returns event_archive_disabled when CASTLE_GENESIS_EVENT_ARCHIVE not 1", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "gcea-"));
  try {
    process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
    process.env.CASTLE_GENESIS_EVENT_ARCHIVE = "0";
    process.env.CASTLE_GENESIS_DATA_DIR = tmp;
    const q = await queryGenesisContinuityEventArchiveV0(1, 10, "", 64);
    assert.equal(q.ok, false);
    assert.equal(q.error, "event_archive_disabled");
  } finally {
    await rmTmp(tmp);
  }
});

test("query returns genesis_ephemeral_mode when disk persist explicitly 0", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "gcea-"));
  try {
    process.env.CASTLE_GENESIS_DISK_PERSIST = "0";
    process.env.CASTLE_GENESIS_EVENT_ARCHIVE = "1";
    process.env.CASTLE_GENESIS_DATA_DIR = tmp;
    const q = await queryGenesisContinuityEventArchiveV0(1, 5, "", 64);
    assert.equal(q.ok, false);
    assert.equal(q.error, "genesis_ephemeral_mode");
  } finally {
    await rmTmp(tmp);
  }
});

test("publish appends JSONL and query filters by type", async (t) => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "gcea-"));
  t.after(() => rmTmp(tmp));
  process.env.CASTLE_GENESIS_DISK_PERSIST = "1";
  process.env.CASTLE_GENESIS_EVENT_ARCHIVE = "1";
  process.env.CASTLE_GENESIS_DATA_DIR = tmp;
  resetGenesisContinuityStreamHubForTests();
  resetGenesisContinuityEventArchiveForTests();

  publishGenesisContinuityEvent({ type: "SealIssued", id: "s1", payload: { x: 1 } });
  publishGenesisContinuityEvent({ type: "TickAdvanced", id: "t1", payload: { value: 1 } });
  await new Promise((r) => setTimeout(r, 150));

  const all = await queryGenesisContinuityEventArchiveV0(1, 99, "", 256);
  assert.equal(all.ok, true);
  assert.equal(all.count, 2);

  const tickOnly = await queryGenesisContinuityEventArchiveV0(1, 99, "TickAdvanced", 64);
  assert.equal(tickOnly.ok, true);
  assert.equal(tickOnly.count, 1);
  assert.equal(String(/** @type {{ type?: unknown }} */ (tickOnly.events[0]).type), "TickAdvanced");
});
