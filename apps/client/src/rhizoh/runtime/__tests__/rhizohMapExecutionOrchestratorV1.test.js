import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  attachRhizohMapExecutionOrchestratorV1,
  resetRhizohMapExecutionOrchestratorForTestV1
} from "../rhizohMapExecutionOrchestratorV1.js";
import { RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1 } from "../sovereignWorldMapNodesV0.js";
import {
  ORCHESTRATOR_ACTION_REGISTRY_V0,
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  routeSymbyoMapInteractionToOrchestratorV0,
  SYMBYO_MAP_INTERACTION_V0
} from "../symbyoMapIntentBridgeV0.js";
import * as goLearningWire from "../goLearningMediaTubeWireV0.js";

describe("rhizohMapExecutionOrchestratorV1", () => {
  beforeEach(() => {
    resetRhizohMapExecutionOrchestratorForTestV1();
  });

  afterEach(() => {
    resetRhizohMapExecutionOrchestratorForTestV1();
  });

  it("opens media tube with pin-specific channel on map click", () => {
    const opened = [];
    window.addEventListener(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, (ev) => {
      opened.push(ev.detail);
    });
    attachRhizohMapExecutionOrchestratorV1();

    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: SYMBYO_MAP_INTERACTION_V0.CLICK,
      node: { id: "event", label: "EVENT", type: "zone", lat: 1, lon: 2, color: "#fff" }
    });
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER);

    window.dispatchEvent(
      new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, {
        detail: {
          ...routed,
          nodeView: { id: "event", label: "EVENT", type: "zone", color: "#fff" }
        }
      })
    );

    expect(opened.length).toBe(1);
    expect(opened[0].node.id).toBe("event");
    expect(opened[0].initialChannelId).toBe("nasa");
    expect(opened[0].source).toBe("map:node:event");
  });

  it("dedupes duplicate map intent within 100ms", () => {
    const opened = [];
    window.addEventListener(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, () => {
      opened.push(1);
    });
    attachRhizohMapExecutionOrchestratorV1();

    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: SYMBYO_MAP_INTERACTION_V0.CLICK,
      node: { id: "event", label: "EVENT", type: "zone", color: "#fff" }
    });
    const detail = {
      ...routed,
      nodeView: { id: "event", label: "EVENT", type: "zone", color: "#fff" }
    };
    window.dispatchEvent(new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, { detail }));
    window.dispatchEvent(new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, { detail }));

    expect(opened.length).toBe(1);
  });

  it("routes go_arena pin to go learning media tube wire", () => {
    const spy = vi.spyOn(goLearningWire, "dispatchOpenGoLearningMediaTubeV0");
    attachRhizohMapExecutionOrchestratorV1();

    const routed = routeSymbyoMapInteractionToOrchestratorV0({
      interaction: SYMBYO_MAP_INTERACTION_V0.CLICK,
      node: { id: "go_arena", label: "GO", type: "zone", color: "#38bdf8" }
    });
    expect(routed.normalizedDecision.decision).toBe(ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER);

    window.dispatchEvent(
      new CustomEvent(RHIZOH_V11_MAP_INTENT_EVENT_V0, {
        detail: {
          ...routed,
          nodeView: { id: "go_arena", label: "GO", type: "zone", color: "#38bdf8" }
        }
      })
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].node.id).toBe("go_arena");
    spy.mockRestore();
  });
});
