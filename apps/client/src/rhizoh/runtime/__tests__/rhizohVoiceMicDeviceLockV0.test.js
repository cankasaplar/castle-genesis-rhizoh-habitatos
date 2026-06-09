import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  __resetVoiceMicPinForTestV0,
  isVirtualOrLoopbackMicLabelV0,
  pinVoiceMicDeviceV0,
  resolveVoiceMicBlockedSpeakTextV0,
  resolveVoiceMicCaptureDeviceV0
} from "../rhizohVoiceMicDeviceLockV0.js";

describe("rhizohVoiceMicDeviceLockV0", () => {
  beforeEach(() => {
    __resetVoiceMicPinForTestV0();
  });

  afterEach(() => {
    __resetVoiceMicPinForTestV0();
  });

  it("flags stereo mix and virtual device labels", () => {
    expect(isVirtualOrLoopbackMicLabelV0("Stereo Mix (Realtek Audio)")).toBe(true);
    expect(isVirtualOrLoopbackMicLabelV0("VB-Audio Virtual Cable")).toBe(true);
    expect(isVirtualOrLoopbackMicLabelV0("Microphone Array (Intel)")).toBe(false);
  });

  it("resolves first safe device when enumerateDevices unavailable", async () => {
    const v = await resolveVoiceMicCaptureDeviceV0();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      expect(v.ok).toBe(false);
      return;
    }
    expect(v.ok).toBe(true);
    expect(v.deviceId).toBeTruthy();
  });

  it("allows opaque default mic before permission grant", async () => {
    const prev = navigator.mediaDevices?.enumerateDevices;
    if (!prev) return;
    navigator.mediaDevices.enumerateDevices = async () => [
      { kind: "audioinput", deviceId: "", label: "", groupId: "g1" }
    ];
    const v = await resolveVoiceMicCaptureDeviceV0();
    navigator.mediaDevices.enumerateDevices = prev;
    expect(v.ok).toBe(true);
    expect(v.reason).toBe("default_mic_pre_permission");
    expect(v.deviceId).toBeNull();
  });

  it("localizes mic blocked speak text", () => {
    expect(resolveVoiceMicBlockedSpeakTextV0("no_audio_input", "tr")).toMatch(/mikrofon/i);
    expect(resolveVoiceMicBlockedSpeakTextV0("no_audio_input", "en")).toMatch(/microphone/i);
  });

  it("pins preferred safe device id", async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    const first = await resolveVoiceMicCaptureDeviceV0();
    if (!first.ok) return;
    pinVoiceMicDeviceV0(first.deviceId);
    const second = await resolveVoiceMicCaptureDeviceV0({ preferredDeviceId: first.deviceId });
    expect(second.ok).toBe(true);
    expect(second.deviceId).toBe(first.deviceId);
    expect(second.reason).toBe("pinned_mic");
  });
});
