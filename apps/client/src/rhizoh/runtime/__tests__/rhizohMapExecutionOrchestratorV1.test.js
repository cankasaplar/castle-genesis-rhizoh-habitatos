import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  attachRhizohMapExecutionOrchestratorV1,
  resetRhizohMapExecutionOrchestratorForTestV1
} from "../rhizohMapExecutionOrchestratorV1.js";
import {
  ORCHESTRATOR_ACTION_REGISTRY_V0,
  RHIZOH_OPEN_WORKSPACE_EVENT_V1,
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  routeSymbyoMapInteractionToOrchestratorV0,
  SYMBYO_MAP_INTERACTION_V0
} from "../symbyoMapIntentBridgeV0.js";

describe("rhizohMapExecutionOrchestratorV1", () => {
  beforeEach(() => {
    resetRhizohMapExecutionOrchestratorForTestV1();
  });

  afterEach(() => {
    resetRhizohMapExecutionOrchestratorForTestV1();
  });

  it("opens workspace on V11 tower click intent", () => {
    const opened = [];
    window.addEventListener(RHIZOH_OPEN_WORKSPACE_EVENT_V1, (ev) => {
      opened.push(ev.detail);
    });
    attachRhizohMapExecutionOrchestratorV1();

    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: SYMBYO_MAP_INTERACTION_V0.CLICK,
      node: { id: "gemini_tower", label: "GEMINI", type: "tower", lat: 1, lon: 2, color: "#fff" }
    });
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER);

    window.dispatchEvent(
      new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, {
        detail: {
          ...routed,
          nodeView: { id: "gemini_tower", label: "GEMINI", type: "tower", color: "#fff" }
        }
      })
    );

    expect(opened.length).toBe(1);
    expect(opened[0].node.id).toBe("gemini_tower");
    expect(opened[0].runtime?.workspaceId).toBe("gemini_workspace_v1");
    expect(opened[0].mediaPlayer).toBe(true);
  });
});
