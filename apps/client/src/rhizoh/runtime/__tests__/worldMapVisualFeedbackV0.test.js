import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  RHIZOH_MAP_GHOST_TRAIL_HINT_EVENT_V0,
  RHIZOH_MAP_VISUAL_PULSE_CLASS_V0,
  applyMapCameraVisualFeedbackV0,
  emitMapGhostTrailHintV0,
  pulseMapViewportV0,
  speakMapCommandAckV0,
  __resetWorldMapVisualFeedbackForTestV0
} from "../worldMapVisualFeedbackV0.js";
import {
  setRhizohCatchUpReplayActiveV0,
  __resetRhizohCatchUpGuardForTestV0
} from "../rhizohCatchUpGuardV0.js";
import { PersistentCodexBusV0 } from "../../../core/PersistentBusV0.js";

vi.mock("../../../core/PersistentBusV0.js", () => ({
  PersistentCodexBusV0: {
    GHOST_SPAWN: vi.fn(() => Promise.resolve({ ok: true }))
  }
}));

describe("worldMapVisualFeedbackV0", () => {
  beforeEach(() => {
    __resetWorldMapVisualFeedbackForTestV0();
    __resetRhizohCatchUpGuardForTestV0();
    vi.mocked(PersistentCodexBusV0.GHOST_SPAWN).mockClear();
    document.body.innerHTML =
      '<div data-rhizoh-world-space-map-host="1"></div><div data-cesium-real-map-layer="1"></div>';
    vi.useFakeTimers();
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        constructor(text) {
          this.text = text;
        }
      }
    );
    window.speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn(),
      getVoices: vi.fn(() => [])
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pulses map host on zoom", () => {
    expect(pulseMapViewportV0("zoom_out")).toBe(true);
    const host = document.querySelector('[data-rhizoh-world-space-map-host="1"]');
    expect(host.classList.contains(RHIZOH_MAP_VISUAL_PULSE_CLASS_V0)).toBe(true);
    vi.advanceTimersByTime(520);
    expect(host.classList.contains(RHIZOH_MAP_VISUAL_PULSE_CLASS_V0)).toBe(false);
  });

  it("emits ghost trail hint event", () => {
    const events = [];
    window.addEventListener(RHIZOH_MAP_GHOST_TRAIL_HINT_EVENT_V0, (ev) => events.push(ev.detail));
    emitMapGhostTrailHintV0({ lat: 41.01, lon: 28.97, action: "zoom_out" });
    expect(events[0]).toEqual(
      expect.objectContaining({ lat: 41.01, lon: 28.97, action: "zoom_out" })
    );
  });

  it("speaks map command ack", () => {
    expect(speakMapCommandAckV0({ action: "zoom_out", locale: "tr" })).toBe(true);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it("applyMapCameraVisualFeedbackV0 runs full chain", () => {
    const out = applyMapCameraVisualFeedbackV0({
      action: "zoom_in",
      canonical: "map_zoom_in",
      center: { lat: 41.01, lon: 28.97 }
    });
    expect(out.pulsed).toBe(true);
    expect(out.ghostTrail).toBe(true);
    expect(out.voiceAck).toBe(true);
  });

  it("mutes voice and ghost spawn during catch-up replay", () => {
    setRhizohCatchUpReplayActiveV0(true);
    expect(speakMapCommandAckV0({ action: "fly_to", locale: "tr" })).toBe(false);
    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    emitMapGhostTrailHintV0({ lat: 41.01, lon: 28.97, action: "fly_to" });
    expect(PersistentCodexBusV0.GHOST_SPAWN).not.toHaveBeenCalled();
    const out = applyMapCameraVisualFeedbackV0({ action: "zoom_out", canonical: "map_zoom_out" });
    expect(out.muted).toBe(true);
    setRhizohCatchUpReplayActiveV0(false);
  });
});
