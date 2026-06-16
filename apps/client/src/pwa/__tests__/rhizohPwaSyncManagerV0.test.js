import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetRhizohPwaSyncManagerForTestV0,
  enqueueRhizohPwaSyncV0,
  flushRhizohPwaSyncQueueV0,
  getRhizohPwaSyncQueueSnapshotV0
} from "../rhizohPwaSyncManagerV0.js";
import {
  __resetRhizohPwaPermissionsN12ForTestV0,
  writeRhizohPwaPermissionsN12V0
} from "../rhizohPwaPermissionsN12V0.js";

describe("rhizohPwaSyncManagerV0", () => {
  beforeEach(() => {
    __resetRhizohPwaSyncManagerForTestV0();
    __resetRhizohPwaPermissionsN12ForTestV0();
  });

  it("rejects enqueue when topology grant is off", () => {
    const out = enqueueRhizohPwaSyncV0({ type: "ghost_event", payload: { id: "g1" } });
    expect(out.ok).toBe(false);
    expect(out.reason).toBe("n12_topology_denied");
  });

  it("queues and flushes when topology granted", async () => {
    writeRhizohPwaPermissionsN12V0({ topology: true });
    const enq = enqueueRhizohPwaSyncV0({ type: "ghost_event", payload: { id: "g1" } });
    expect(enq.ok).toBe(true);
    expect(getRhizohPwaSyncQueueSnapshotV0().count).toBe(1);
    const flush = await flushRhizohPwaSyncQueueV0();
    expect(flush.ok).toBe(true);
    expect(flush.flushed).toBe(1);
    expect(getRhizohPwaSyncQueueSnapshotV0().count).toBe(0);
  });
});
