import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  dispatchV11MapEventPinV0,
  RHIZOH_MAP_EVENT_PIN_EVENT_V0
} from "../mapEventPinDispatchV0.js";
import { RHIZOH_V11_MAP_INTENT_EVENT_V0 } from "../symbyoMapIntentBridgeV0.js";

describe("mapEventPinDispatchV0", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("spiralmmo hover emits preview intent without awakening route", () => {
    const intents = [];
    const pinEvents = [];
    window.addEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, (ev) => intents.push(ev.detail));
    window.addEventListener(RHIZOH_MAP_EVENT_PIN_EVENT_V0, (ev) => pinEvents.push(ev.detail));

    const node = Object.freeze({
      id: "spiralmmo_europe",
      type: "spiralmmo",
      continent: "europe",
      lat: 48.8,
      lon: 2.3
    });

    const result = dispatchV11MapEventPinV0(node, "hover", { latLngToContainerPoint: () => ({ x: 10, y: 20 }) });

    expect(result.ok).toBe(true);
    expect(result.route).toBe("spiralmmo_preview");
    expect(intents).toHaveLength(1);
    expect(intents[0]?.intent?.intent).toBe("PREVIEW_NODE");
    expect(intents[0]?.intent?.context).toContain("hover");
    expect(pinEvents[0]?.route).toBe("spiral_preview");
  });

  it("spiralmmo click still routes to awakening", () => {
    const intents = [];
    window.addEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, (ev) => intents.push(ev.detail));

    const node = Object.freeze({
      id: "spiralmmo_europe",
      type: "spiralmmo",
      continent: "europe"
    });

    const result = dispatchV11MapEventPinV0(node, "click");

    expect(result.ok).toBe(true);
    expect(result.route).toBe("spiralmmo");
    expect(intents).toHaveLength(1);
    expect(intents[0]?.intent?.context).toContain("click");
  });
});
