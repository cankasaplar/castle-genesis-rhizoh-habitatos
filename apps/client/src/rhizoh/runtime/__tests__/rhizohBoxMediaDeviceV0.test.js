import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  __resetRhizohBoxMediaPinForTestV0,
  isRhizohBoxMediaLabelV0,
  resolveRhizohBoxDeviceWithHierarchyV0,
  resolveRhizohBoxMediaDevicesV0,
  RHIZOH_BOX_RESOLVE_STEP_V0
} from "../rhizohBoxMediaDeviceV0.js";

function mockNavigator(devices) {
  vi.stubGlobal("navigator", {
    mediaDevices: { enumerateDevices: vi.fn(async () => devices) }
  });
  vi.stubGlobal("window", {
    sessionStorage: {
      _m: new Map(),
      getItem(k) {
        return this._m.get(k) ?? null;
      },
      setItem(k, v) {
        this._m.set(k, v);
      },
      removeItem(k) {
        this._m.delete(k);
      }
    },
    localStorage: {
      _m: new Map(),
      getItem(k) {
        return this._m.get(k) ?? null;
      },
      setItem(k, v) {
        this._m.set(k, v);
      },
      removeItem(k) {
        this._m.delete(k);
      }
    },
    dispatchEvent: () => true
  });
}

describe("rhizohBoxMediaDeviceV0", () => {
  beforeEach(() => {
    __resetRhizohBoxMediaPinForTestV0();
    vi.unstubAllGlobals();
  });

  it("matches rhizoh box labels", () => {
    expect(isRhizohBoxMediaLabelV0("Rhizoh Box Camera", "video")).toBe(true);
    expect(isRhizohBoxMediaLabelV0("Rhizoh Box Mic", "audio")).toBe(true);
    expect(isRhizohBoxMediaLabelV0("Stereo Mix", "audio")).toBe(false);
  });

  it("resolves label_regex then pins ids", async () => {
    mockNavigator([
      { kind: "videoinput", deviceId: "cam-box", groupId: "g-cam", label: "Rhizoh Box HD" },
      { kind: "videoinput", deviceId: "cam-laptop", groupId: "g-lap", label: "Integrated Camera" },
      { kind: "audioinput", deviceId: "mic-box", groupId: "g-mic", label: "Rhizoh Box Microphone" },
      { kind: "audioinput", deviceId: "mic-virtual", groupId: "g-vm", label: "Stereo Mix" }
    ]);

    const out = await resolveRhizohBoxMediaDevicesV0();
    expect(out.ok).toBe(true);
    expect(out.camDeviceId).toBe("cam-box");
    expect(out.micDeviceId).toBe("mic-box");
    expect(out.camResolveStep).toBe(RHIZOH_BOX_RESOLVE_STEP_V0.LABEL_REGEX);
    expect(out.micResolveStep).toBe(RHIZOH_BOX_RESOLVE_STEP_V0.LABEL_REGEX);
  });

  it("falls back to group_id_lkg when deviceId rotates", () => {
    const candidates = [
      { deviceId: "cam-new", groupId: "g-cam", label: "Rhizoh Box HD", virtual: false }
    ];
    const pick = resolveRhizohBoxDeviceWithHierarchyV0(candidates, "video", {
      pin: { cam: { deviceId: "cam-old", groupId: "", label: "" }, mic: { deviceId: "", groupId: "", label: "" } },
      lkg: { cam: { deviceId: "cam-old", groupId: "g-cam", label: "Rhizoh Box HD" }, mic: { deviceId: "", groupId: "", label: "" } }
    });
    expect(pick.device?.deviceId).toBe("cam-new");
    expect(pick.resolveStep).toBe(RHIZOH_BOX_RESOLVE_STEP_V0.GROUP_ID_LKG);
  });

  it("prefers exact_device_id_pin over label_regex", () => {
    const candidates = [
      { deviceId: "cam-pin", groupId: "g1", label: "Generic USB", virtual: false },
      { deviceId: "cam-box", groupId: "g2", label: "Rhizoh Box HD", virtual: false }
    ];
    const pick = resolveRhizohBoxDeviceWithHierarchyV0(candidates, "video", {
      pin: { cam: { deviceId: "cam-pin", groupId: "g1", label: "Generic USB" }, mic: { deviceId: "", groupId: "", label: "" } },
      lkg: { cam: { deviceId: "", groupId: "", label: "" }, mic: { deviceId: "", groupId: "", label: "" } }
    });
    expect(pick.device?.deviceId).toBe("cam-pin");
    expect(pick.resolveStep).toBe(RHIZOH_BOX_RESOLVE_STEP_V0.EXACT_DEVICE_ID_PIN);
  });
});
