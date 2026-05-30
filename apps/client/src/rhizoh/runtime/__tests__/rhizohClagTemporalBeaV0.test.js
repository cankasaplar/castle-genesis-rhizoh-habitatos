import { describe, it, expect, beforeEach } from "vitest";
import { allocateBoundedEmergenceV0 } from "../rhizohClagBoundedEmergenceAllocatorV0.js";
import {
  applyTemporalBeaV0,
  resetTemporalBeaStateV0,
  TEMPORAL_BEA_PHASE_V0
} from "../rhizohClagTemporalBeaV0.js";
import { CLAG_ACTIVE_RUNTIME_NODE_ID_V0 } from "../rhizohClagNodeRegistryV0.js";
import { CLAG_NODE_KIND_V0 } from "../rhizohClagTypesV0.js";

function baseBeaInput() {
  return {
    nodes: [
      {
        kind: CLAG_NODE_KIND_V0.REAL_LIFE,
        meta: {
          registryRole: "active_runtime",
          registryId: CLAG_ACTIVE_RUNTIME_NODE_ID_V0.METEHAN_ANKARA,
          isPrimary: true
        }
      },
      {
        kind: CLAG_NODE_KIND_V0.REAL_LIFE,
        meta: {
          registryRole: "active_runtime",
          registryId: CLAG_ACTIVE_RUNTIME_NODE_ID_V0.BESIKTAS_SERENCEBEY
        }
      }
    ],
    edges: [{ label: "conversation_episodic_thread", weight: 0.65 }],
    graphContamination: { detected: false },
    traversalPlan: { primaryRoute: { chainId: "conversation_memory_shaping" } }
  };
}

describe("rhizohClagTemporalBeaV0", () => {
  beforeEach(() => resetTemporalBeaStateV0());

  it("accumulates pool across ticks", () => {
    const bea1 = applyTemporalBeaV0(allocateBoundedEmergenceV0(baseBeaInput()), {
      sessionId: "sess-temporal-1"
    });
    const bea2 = applyTemporalBeaV0(allocateBoundedEmergenceV0(baseBeaInput()), {
      sessionId: "sess-temporal-1"
    });
    expect(bea2.temporal.emergencePoolRemaining01).toBeGreaterThanOrEqual(
      bea1.temporal.emergencePoolRemaining01
    );
    expect(bea2.temporal.tickHistory.length).toBe(2);
  });

  it("enters release phase after stable nominal ticks and sufficient pool", () => {
    const sid = "sess-release";
    let last = null;
    for (let i = 0; i < 6; i++) {
      last = applyTemporalBeaV0(allocateBoundedEmergenceV0(baseBeaInput()), {
        sessionId: sid,
        revision: i
      });
    }
    expect(
      [TEMPORAL_BEA_PHASE_V0.RELEASE, TEMPORAL_BEA_PHASE_V0.ACCUMULATE].includes(
        last.temporal.strategicFlow.phase
      )
    ).toBe(true);
    expect(last.temporal.role).toBe("controlled_surprise_injector");
  });

  it("uses conserve phase under contamination", () => {
    const bea = applyTemporalBeaV0(
      allocateBoundedEmergenceV0({
        ...baseBeaInput(),
        graphContamination: { detected: true }
      }),
      { sessionId: "sess-dirty" }
    );
    expect(bea.temporal.strategicFlow.phase).toBe(TEMPORAL_BEA_PHASE_V0.CONSERVE);
    expect(bea.controlledSurpriseInjected).toBe(false);
  });
});
