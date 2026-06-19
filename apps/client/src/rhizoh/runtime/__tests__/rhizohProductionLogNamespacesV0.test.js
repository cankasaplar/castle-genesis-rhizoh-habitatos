import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  isRhizohVerboseConsoleV0,
  logCastleLifecycleV0,
  logVoiceInfoV0,
  shouldEmitCastleLifecycleConsoleV0,
  shouldEmitVoiceConsoleInfoV0
} from "../rhizohProductionLogNamespacesV0.js";

describe("rhizohProductionLogNamespacesV0", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.__rhizoh = {};
    }
    vi.stubEnv("VITE_DEBUG", "0");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("quiets heartbeat voice tags in production", () => {
    expect(isRhizohVerboseConsoleV0()).toBe(false);
    expect(shouldEmitVoiceConsoleInfoV0("PULSE_LOOP_TICK")).toBe(false);
    expect(shouldEmitVoiceConsoleInfoV0("STT_DISPATCH")).toBe(true);
  });

  it("quiets routine castle lifecycle stages in production", () => {
    expect(shouldEmitCastleLifecycleConsoleV0("chess_move_played")).toBe(false);
    expect(shouldEmitCastleLifecycleConsoleV0("boot_sim_persistence")).toBe(true);
  });

  it("allows verbose override via window debug flag", () => {
    if (typeof window === "undefined") return;
    window.__rhizoh.debug = { consoleVerbose: true };
    expect(isRhizohVerboseConsoleV0()).toBe(true);
    expect(shouldEmitVoiceConsoleInfoV0("PULSE_LOOP_TICK")).toBe(true);
  });

  it("logVoiceInfoV0 no-ops quiet tags in production", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logVoiceInfoV0("PULSE_LOOP_TICK", { seq: 1 });
    logVoiceInfoV0("STT_DISPATCH", { preview: "test" });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain("STT_DISPATCH");
    spy.mockRestore();
  });

  it("logCastleLifecycleV0 no-ops quiet stages in production", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logCastleLifecycleV0("chess_move_played", { san: "e4" });
    logCastleLifecycleV0("boot_sim_persistence", { mode: "event_sourced" });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain("boot_sim_persistence");
    spy.mockRestore();
  });
});
