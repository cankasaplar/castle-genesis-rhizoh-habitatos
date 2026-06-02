import { describe, expect, it, vi, afterEach } from "vitest";
import { isCastleLayerRenderableV1, publishCastleLayerAuditV1 } from "../castleLayerGateV1.js";

describe("castleLayerGateV1", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks legacy mic UI in all modes", () => {
    expect(isCastleLayerRenderableV1("voice_v1_loop_mic_ui")).toBe(false);
    expect(isCastleLayerRenderableV1("voice_v1_loop_mic_ui", { advancedOpen: true })).toBe(false);
  });

  it("voice v3 dock mic always renderable in T0 shell", () => {
    expect(isCastleLayerRenderableV1("voice_v3_dock_mic")).toBe(true);
    expect(isCastleLayerRenderableV1("voice_v3_dock_mic", { advancedOpen: false })).toBe(true);
  });

  it("product camera dock renderable in T0 shell", () => {
    expect(isCastleLayerRenderableV1("product_camera_dock")).toBe(true);
  });

  it("T0 normal audit — both mic layers mounted false, no mismatches", () => {
    const audit = publishCastleLayerAuditV1({
      advancedOpen: false,
      mounted: {
        voice_v1_loop_mic_ui: false,
        voice_v3_dock_mic: false,
        t0_slot_chat_surface: true,
        t0_slot_state_indicator: true,
        t0_slot_layer_toggle: true
      }
    });
    expect(audit.mismatches).toEqual([]);
    expect(audit.rows.find((r) => r.id === "voice_v1_loop_mic_ui")?.mounted).toBe(false);
    expect(audit.rows.find((r) => r.id === "voice_v3_dock_mic")?.mounted).toBe(false);
    expect(audit.advancedOpen).toBe(false);
  });

  it("advanced audit — voice_v3_dock_mic mounted true in unified dock", () => {
    const showMic = isCastleLayerRenderableV1("voice_v3_dock_mic", { advancedOpen: false });
    expect(showMic).toBe(true);
    const audit = publishCastleLayerAuditV1({
      advancedOpen: false,
      mounted: {
        voice_v1_loop_mic_ui: false,
        voice_v3_dock_mic: showMic,
        t0_slot_chat_surface: true
      }
    });
    expect(audit.mismatches).toEqual([]);
    expect(audit.rows.find((r) => r.id === "voice_v3_dock_mic")?.mounted).toBe(true);
  });

  it("allows T0 shell slots", () => {
    expect(isCastleLayerRenderableV1("t0_slot_chat_surface")).toBe(true);
    expect(isCastleLayerRenderableV1("t0_slot_state_indicator")).toBe(true);
  });

  it("gateway banner only in advanced", () => {
    expect(isCastleLayerRenderableV1("gateway_banner_panel")).toBe(false);
    expect(isCastleLayerRenderableV1("gateway_banner_panel", { advancedOpen: true })).toBe(true);
  });

  it("audit reports mismatch when ghost mount flagged", () => {
    const a = publishCastleLayerAuditV1({
      advancedOpen: false,
      mounted: { voice_v1_loop_mic_ui: true }
    });
    expect(a.mismatches).toContain("voice_v1_loop_mic_ui");
  });
});
