import { describe, it, expect, beforeEach } from "vitest";
import {
  ingestRcilEvent,
  drainRcilQueueOnce,
  getRcilQueueDepth,
  getRcilIdentityPhase,
  RCIL_EVENT_SCHEMA_VERSION,
  runPhase01EpistemicTick,
  PHASE01_CONTINUITY_PROMPT,
  __resetRcilLiveWiringForTests
} from "./rcilLiveWiringV1.js";

describe("rcilLiveWiringV1", () => {
  beforeEach(() => {
    __resetRcilLiveWiringForTests();
  });

  it("rejects empty type", () => {
    const r = ingestRcilEvent({ type: "  " });
    expect(r.ok).toBe(false);
  });

  it("assigns monotonic seq and drains in order", () => {
    const a = ingestRcilEvent({ type: "boot", payload: { x: 1 } });
    const b = ingestRcilEvent({ type: "tick", payload: { x: 2 } });
    expect(a.ok && b.ok).toBe(true);
    expect(b.seq).toBeGreaterThan(a.seq);
    expect(getRcilQueueDepth()).toBe(2);
    const d1 = drainRcilQueueOnce();
    const d2 = drainRcilQueueOnce();
    expect(d1.processed && d2.processed).toBe(true);
    expect(d1.event.seq).toBe(a.seq);
    expect(d2.event.seq).toBe(b.seq);
    expect(getRcilQueueDepth()).toBe(0);
    expect(getRcilIdentityPhase()).toBe("sealed");
  });

  it("exports stable schema version", () => {
    expect(RCIL_EVENT_SCHEMA_VERSION).toBe(1);
  });

  it("runPhase01EpistemicTick runs ingest+drain without persist when disabled", async () => {
    const out = await runPhase01EpistemicTick({ type: "phase01_tick", payload: { n: 1 } }, { persistLedger: false });
    expect(out.ok).toBe(true);
    expect(out.ingest.ok).toBe(true);
    expect(out.drain.processed).toBe(true);
    expect(out.persisted).toBe(false);
    expect(out.snapshot.traceTail.length).toBeGreaterThan(0);
    expect(String(PHASE01_CONTINUITY_PROMPT)).toContain("süreklilik");
  });
});
