import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compressToSystemStateV0,
  interpretSystemStateV0,
  SYSTEM_HEALTH_V0,
  SYSTEM_RISK_V0,
  SYSTEM_PRESSURE_V0
} from "../ops/unifiedStateNarrativeV0.js";
import { FAILURE_MODE_ID_V0 } from "../ops/failureModeClassificationV0.js";

describe("unifiedStateNarrativeV0", () => {
  it("compresses soft saturation load test into stressed + saturation", () => {
    const state = compressToSystemStateV0({
      source: "live_ops",
      gcl: { health: { ok: true } },
      rollout: { limit: 200, activeTurns: 40, zsetPressure: "ok", health: { ok: true } },
      lifecycle: { purged: 0 },
      coordination: { sim: true },
      loadTest: {
        available: true,
        analysis: {
          dominantFailureMode: FAILURE_MODE_ID_V0.SOFT_SATURATION,
          executionMode: "coordination_sim",
          systemHealthIntelligence: { verdict: "degraded_under_stress_sim" }
        }
      }
    });
    assert.equal(state.health, SYSTEM_HEALTH_V0.STRESSED);
    assert.equal(state.risk, SYSTEM_RISK_V0.SATURATION);
    assert.ok(state.pressure !== SYSTEM_PRESSURE_V0.LOW);
    assert.ok(state.confidence >= 0.5);
  });

  it("interpretation is non-executable", () => {
    const state = compressToSystemStateV0({
      source: "live_ops",
      gcl: { health: { ok: true } },
      rollout: { limit: 200, activeTurns: 160, health: { ok: true } },
      lifecycle: { purged: 5 },
      loadTest: { available: false }
    });
    const interp = interpretSystemStateV0(state, { coordination: { sim: false }, loadTest: { available: false } });
    assert.equal(interp.executionContract, "no_automatic_execution_v0");
    assert.ok(interp.suggestedActions.every((a) => a.executable === false));
    assert.ok(interp.narrativeTr.length > 10);
  });
});
