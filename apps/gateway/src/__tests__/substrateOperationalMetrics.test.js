import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  buildSubstrateOperationalSnapshotV0,
  recordClientSubstrateHealthV0,
  recordWalPeerRejectV0,
  renderSubstratePrometheusMetricsV0,
  resetSubstrateOperationalMetricsForTestV0
} from "../infra/substrateOperationalMetrics.js";
import { ingestClientSubstrateHealthV0 } from "../rhizohSubstrateHealthIngestV0.js";

describe("substrateOperationalMetrics", () => {
  beforeEach(() => {
    resetSubstrateOperationalMetricsForTestV0();
  });

  it("records WAL peer reject by code", () => {
    recordWalPeerRejectV0("wal_feed_unsigned");
    const snap = buildSubstrateOperationalSnapshotV0();
    assert.equal(snap.gateway.walPeerRejectTotal, 1);
    assert.equal(snap.gateway.walRejectByCode.wal_feed_unsigned, 1);
  });

  it("ingests client reality health snapshot", () => {
    const r = ingestClientSubstrateHealthV0(
      {
        realityHealth: {
          schema: "castle.rhizoh.reality_health_metrics.v0",
          rates: { drainPassesPerMin: 12, epochBumpsPerMin: 2 },
          counters: {
            quarantineEvents: 3,
            replayMismatchEvents: 1,
            lastDrainLatencyMs: 120
          },
          queuePressure: { peakDepth: 8 }
        }
      },
      { uid: "u1" }
    );
    assert.equal(r.ok, true);
    const snap = buildSubstrateOperationalSnapshotV0();
    assert.equal(snap.clients.activeReports, 1);
    assert.ok(String(renderSubstratePrometheusMetricsV0()).includes("castle_substrate_client_reports_total"));
  });

  it("emits alert hints on replay mismatch burst", () => {
    for (let i = 0; i < 6; i++) {
      recordClientSubstrateHealthV0(
        {
          schema: "castle.rhizoh.reality_health_metrics.v0",
          counters: { replayMismatchEvents: 1 }
        },
        { clientId: `c${i}` }
      );
    }
    const snap = buildSubstrateOperationalSnapshotV0();
    assert.ok(snap.alerts.includes("replay_mismatch_burst"));
  });
});
