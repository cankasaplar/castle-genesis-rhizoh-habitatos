import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getCloudSyncSnapshotV0,
  mergeCloudSyncSnapshotV0,
  resetCloudSyncStoreForTestV0
} from "../castleCloudSyncStore.js";

describe("castleCloudSyncStore", () => {
  it("merges entities and preserves events append-only", async () => {
    await resetCloudSyncStoreForTestV0();
    const uid = "test-user-1";
    await mergeCloudSyncSnapshotV0(uid, {
      entities: [{ id: "ent_1", title: "Doc A", format: "text/plain" }],
      events: [{ id: "evt_1", type: "entity_saved", entityId: "ent_1" }]
    });
    const snap = await getCloudSyncSnapshotV0(uid);
    assert.equal(snap.entities.length, 1);
    assert.equal(snap.events.length, 1);

    await mergeCloudSyncSnapshotV0(uid, {
      entities: [{ id: "ent_1", title: "Doc A updated", tombstonedAt: "2026-01-01T00:00:00.000Z" }],
      events: [{ id: "evt_2", type: "entity_tombstoned", entityId: "ent_1" }]
    });
    const snap2 = await getCloudSyncSnapshotV0(uid);
    assert.equal(snap2.entities[0].title, "Doc A updated");
    assert.equal(snap2.events.length, 2);
  });
});
