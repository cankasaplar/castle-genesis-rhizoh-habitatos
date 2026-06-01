import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildMicroRtlPhaseV0,
  MICRO_MAP_PIN_CHANGE_V0,
  persistEmotionalAnchorV0,
  readEmotionalAnchorV0,
  resetEmotionalAnchorSessionV0,
  triggerMicroExpressiveRealityTransitionV0
} from "../expressiveRealityMicroTransitionV0.js";
import {
  resetExpressiveRealityTransitionSessionV0,
  RTL_SESSION_COMPLETE_KEY_V0
} from "../expressiveRealityTransitionV0.js";

describe("expressiveRealityMicroTransitionV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "1");
    resetExpressiveRealityTransitionSessionV0();
    resetEmotionalAnchorSessionV0();
    sessionStorage.setItem(RTL_SESSION_COMPLETE_KEY_V0, "1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetExpressiveRealityTransitionSessionV0();
    resetEmotionalAnchorSessionV0();
  });

  it("persists emotional anchor across events", () => {
    persistEmotionalAnchorV0(
      {
        label: "Ankara Castle",
        place_name: "Ankara",
        memory_anchor: "Bağlandığın yer: Ankara Castle",
        visible: true
      },
      { kind: MICRO_MAP_PIN_CHANGE_V0 }
    );
    const a = readEmotionalAnchorV0();
    expect(a?.label).toBe("Ankara Castle");
    expect(a?.last_event).toBe(MICRO_MAP_PIN_CHANGE_V0);
  });

  it("builds micro phase with short duration", () => {
    const phase = buildMicroRtlPhaseV0(MICRO_MAP_PIN_CHANGE_V0, readEmotionalAnchorV0());
    expect(phase.variant).toBe("micro");
    expect(phase.durationMs).toBeGreaterThanOrEqual(200);
    expect(phase.durationMs).toBeLessThanOrEqual(400);
  });

  it("dispatches micro event when boot complete", () => {
    const heard = [];
    const handler = (ev) => heard.push(ev.detail?.kind);
    window.addEventListener("rhizoh:rtl-micro", handler);
    const ok = triggerMicroExpressiveRealityTransitionV0(MICRO_MAP_PIN_CHANGE_V0, {
      lifeEntityProjection: {
        projections: [
          {
            projection_kind: "map_pin",
            label: "Castle",
            location: { place_name: "Istanbul street" },
            activation: { visible: true }
          }
        ]
      },
      force: true
    });
    window.removeEventListener("rhizoh:rtl-micro", handler);
    expect(ok).toBe(true);
    expect(heard).toContain(MICRO_MAP_PIN_CHANGE_V0);
  });
});
