import { describe, it, expect, beforeEach } from "vitest";
import {
  ingestRcilEvent,
  drainRcilQueueOnce,
  drainRcilQueueAll,
  getRcilQueueDepth,
  getRcilIdentityPhase,
  RCIL_EVENT_SCHEMA_VERSION,
  RCIL_REPLAY_SNAPSHOT_KIND,
  runPhase01EpistemicTick,
  runRcilControlledPressureLoop,
  subscribeRcilRdvhTrace,
  exportRcilReplaySnapshot,
  hydrateRcilFromReplaySnapshot,
  getRcilContinuityFingerprint,
  classifyRcilRdvhTraceTier,
  PHASE01_CONTINUITY_PROMPT,
  __resetRcilLiveWiringForTests
} from "./rcilLiveWiringV1.js";
import { getRrhpMinimalProjectionSnapshot } from "./rcilRrhpMinimalBridgeV1.js";

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
    expect(d1.rrhp?.outcome).toBe("applied");
    expect(d2.rrhp?.outcome).toBe("applied");
    expect(getRcilQueueDepth()).toBe(0);
    expect(getRcilIdentityPhase()).toBe("sealed");
    expect(getRrhpMinimalProjectionSnapshot().operationalReconcileTotal).toBe(2);
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

  it("RDVH trace subscribers receive pushTrace rows", () => {
    const seen = [];
    const off = subscribeRcilRdvhTrace((row) => seen.push(row.kind));
    ingestRcilEvent({ type: "sub_test" });
    off();
    ingestRcilEvent({ type: "after_unsub" });
    expect(seen).toContain("ingest");
    expect(seen.length).toBe(1);
  });

  it("drainRcilQueueAll empties queue and ends idle after bulk reconcile", () => {
    ingestRcilEvent({ type: "a" });
    ingestRcilEvent({ type: "b" });
    const { drained, phase } = drainRcilQueueAll();
    expect(drained.length).toBe(2);
    expect(getRcilQueueDepth()).toBe(0);
    expect(phase).toBe("idle");
  });

  it("controlled pressure loop ingests and drains count events", async () => {
    const r = await runRcilControlledPressureLoop({ count: 5, persistLedger: false });
    expect(r.ok).toBe(true);
    expect(r.ingestedOk).toBe(5);
    expect(r.drainedCount).toBe(5);
    expect(getRcilQueueDepth()).toBe(0);
    expect(getRrhpMinimalProjectionSnapshot().operationalReconcileTotal).toBe(0);
  });

  it("RRHP bridge: operational reconciles mutate projection; synthetic pressure does not", async () => {
    await runPhase01EpistemicTick({ type: "op_a", payload: { n: 1 } }, { persistLedger: false });
    expect(getRrhpMinimalProjectionSnapshot().operationalReconcileTotal).toBe(1);
    await runRcilControlledPressureLoop({ count: 8, persistLedger: false, rdvPressureAck: true });
    expect(getRrhpMinimalProjectionSnapshot().operationalReconcileTotal).toBe(1);
    expect(getRrhpMinimalProjectionSnapshot().lastOperationalType).toBe("op_a");
  });

  it("classifyRcilRdvhTraceTier marks pressure_loop as synthetic_pressure", () => {
    const ingestRow = { kind: "ingest", event: { source: "pressure_loop", type: "p_0" } };
    expect(classifyRcilRdvhTraceTier(ingestRow)).toBe("synthetic_pressure");
    expect(classifyRcilRdvhTraceTier({ kind: "reconcile_done", source: "client" })).toBe("operational");
  });

  it("operational_only fingerprint drops synthetic_pressure trace rows", async () => {
    await runRcilControlledPressureLoop({ count: 4, persistLedger: false, rdvPressureAck: true });
    ingestRcilEvent({ type: "post_pressure_probe", source: "session_probe" });
    drainRcilQueueOnce();
    const full = getRcilContinuityFingerprint({ semantics: "full_tail" });
    const op = getRcilContinuityFingerprint({ semantics: "operational_only" });
    expect(op.length).toBeGreaterThan(0);
    expect(op).not.toBe(full);
  });

  it("export → reset → hydrate restores continuity fingerprint (multi-session simulation)", () => {
    ingestRcilEvent({ type: "sess_a" });
    ingestRcilEvent({ type: "sess_b" });
    drainRcilQueueOnce();
    const snap = exportRcilReplaySnapshot();
    expect(snap.kind).toBe(RCIL_REPLAY_SNAPSHOT_KIND);
    const fp = snap.continuityFingerprint;
    __resetRcilLiveWiringForTests();
    expect(getRcilContinuityFingerprint()).not.toBe(fp);
    const h = hydrateRcilFromReplaySnapshot(snap);
    expect(h.ok).toBe(true);
    expect(getRcilContinuityFingerprint()).toBe(fp);
  });
});
