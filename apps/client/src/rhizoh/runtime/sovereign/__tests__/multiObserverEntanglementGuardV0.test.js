import { describe, expect, it } from "vitest";
import { EPISTEMIC_EVENT_CLASS_V0 } from "../../epistemicEventBusV0.js";
import { assessObserverResonanceEntanglementRiskV0 } from "../multiObserverEntanglementGuardV0.js";

describe("multiObserverEntanglementGuardV0 (22)", () => {
  it("blocks entanglement coupling always", () => {
    const a = assessObserverResonanceEntanglementRiskV0({
      trace: [
        {
          eventClass: EPISTEMIC_EVENT_CLASS_V0.OBSERVER,
          kind: "observer_action"
        },
        { eventClass: EPISTEMIC_EVENT_CLASS_V0.PHYSICS, kind: "drift" }
      ],
      resonanceReport: { pairs: [{ from: "a", to: "b" }] }
    });
    expect(a.entanglementCouplingAllowed).toBe(false);
    expect(a.entanglementLoopBlocked).toBe(true);
  });
});
