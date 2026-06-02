import { describe, expect, it } from "vitest";
import {
  CEOL_BINDING_SENTENCE_V0,
  CEOL_STATE_FLOW_THREAD_V0,
  CEOL_STATE_PLAY_READY_V0,
  CEOL_STATE_T0_READY_V0,
  resolveCeolChoreographyV0
} from "../rhizohCeolV0.js";
import { FCL_ENTRY_FIRST_V0, FCL_ENTRY_RETURN_V0 } from "../rhizohFlowContinuityV0.js";

describe("rhizohCeolV0", () => {
  it("exposes CEOL binding", () => {
    expect(CEOL_BINDING_SENTENCE_V0).toContain("first five seconds");
  });

  it("T0_READY at 0ms with substrate always on", () => {
    const c = resolveCeolChoreographyV0({ elapsedMs: 0, entryMode: FCL_ENTRY_FIRST_V0 });
    expect(c.choreography_state).toBe(CEOL_STATE_T0_READY_V0);
    expect(c.visibility.show_world_substrate).toBe(true);
    expect(c.no_empty_screen_guarantee).toBeTruthy();
  });

  it("PLAY_READY after 5s without auto-opening chrome panels", () => {
    const c = resolveCeolChoreographyV0({ elapsedMs: 5200, entryMode: FCL_ENTRY_FIRST_V0 });
    expect(c.choreography_state).toBe(CEOL_STATE_PLAY_READY_V0);
    expect(c.play_ready).toBe(true);
    expect(c.visibility.show_intent_anchors).toBe(false);
    expect(c.visibility.show_world_substrate).toBe(true);
  });

  it("return path compresses to FLOW_THREAD earlier", () => {
    const c = resolveCeolChoreographyV0({ elapsedMs: 2200, entryMode: FCL_ENTRY_RETURN_V0 });
    expect(c.choreography_state).toBe(CEOL_STATE_FLOW_THREAD_V0);
    expect(c.in_entry_window).toBe(true);
  });
});
