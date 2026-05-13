import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGenesisRuntimeSurfacePayload,
  recordGenesisEpistemicSealIssued
} from "../genesisRuntimeSurfaceV0.js";
import { rhizohEnterpriseMetrics } from "../infra/rhizohEnterpriseMetrics.js";

test("buildGenesisRuntimeSurfacePayload includes replay alignment from worker", () => {
  const infraMetrics = { queueLag: 0, queueDepth: 0, errors: 0, eventsProcessed: 3 };
  const scored = { status: "healthy", score: 0.95, reasons: [] };
  const mesh = { roomCount: 0, uniqueClientUids: 0, maxSeqAcrossRooms: 0, appendOnlyLogEntries: 0, sseListenerCount: 0 };
  const p = buildGenesisRuntimeSurfacePayload({
    infraMetrics,
    scoredHealth: scored,
    rhizohEnterpriseMetrics,
    mesh,
    workerHealth: { status: "healthy", metrics: { divergenceTotal: 0 } },
    port: 8090,
    spiralWebSocketClientsActive: 0
  });
  assert.equal(p.replay.alignment, "no_divergence_signal");
  assert.equal(p.replay.divergenceTotal, 0);
});

test("seal surface reflects last issued hash", () => {
  recordGenesisEpistemicSealIssued("seal_test_hash");
  const infraMetrics = { queueLag: 0, queueDepth: 0, errors: 0, eventsProcessed: 0 };
  const scored = { status: "healthy", score: 0.95, reasons: [] };
  const mesh = {};
  const p = buildGenesisRuntimeSurfacePayload({
    infraMetrics,
    scoredHealth: scored,
    rhizohEnterpriseMetrics,
    mesh,
    workerHealth: null,
    port: 8090
  });
  assert.equal(p.lastEpistemicSeal?.sealHash, "seal_test_hash");
});
