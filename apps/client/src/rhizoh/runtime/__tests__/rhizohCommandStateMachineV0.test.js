import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetCommandStateMachineForTestV0,
  applyCommandStateTransitionV0,
  COMMAND_LISTENING_STATE_V0,
  COMMAND_PERCEPTION_STATE_V0,
  COMMAND_SYSTEM_STATE_V0,
  hydrateCommandStateMachineV0,
  isActiveListeningV0,
  isSystemPausedV0,
  readCommandStateMachineV0,
  readPerceptionModeV0
} from "../rhizohCommandStateMachineV0.js";

describe("rhizohCommandStateMachineV0", () => {
  beforeEach(() => {
    __resetCommandStateMachineForTestV0();
  });

  it("pause → system_paused", () => {
    const t = applyCommandStateTransitionV0("system_pause", { layer: "system", action: "pause" });
    expect(t.ok).toBe(true);
    expect(isSystemPausedV0()).toBe(true);
    expect(readCommandStateMachineV0().system).toBe(COMMAND_SYSTEM_STATE_V0.PAUSED);
  });

  it("listen → active_listening", () => {
    applyCommandStateTransitionV0("start_listening", { layer: "audio", action: "start_listening" });
    expect(isActiveListeningV0()).toBe(true);
    expect(readCommandStateMachineV0().listening).toBe(COMMAND_LISTENING_STATE_V0.ACTIVE_LISTENING);
  });

  it("ghost mode → altered perception", () => {
    applyCommandStateTransitionV0("mode_ghost_enter", { layer: "system", action: "ghost_mode_on" });
    expect(readPerceptionModeV0()).toBe(COMMAND_PERCEPTION_STATE_V0.GHOST);
    applyCommandStateTransitionV0("mode_ghost_exit", { layer: "system", action: "ghost_mode_off" });
    expect(readPerceptionModeV0()).toBe(COMMAND_PERCEPTION_STATE_V0.NOMINAL);
  });

  it("persists across hydrate (session)", () => {
    applyCommandStateTransitionV0("system_pause", { layer: "system", action: "pause" });
    const reloaded = hydrateCommandStateMachineV0();
    expect(reloaded.system).toBe(COMMAND_SYSTEM_STATE_V0.PAUSED);
    expect(readCommandStateMachineV0().system).toBe(COMMAND_SYSTEM_STATE_V0.PAUSED);
  });
});
