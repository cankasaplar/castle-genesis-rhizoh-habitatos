import { describe, expect, it, beforeEach } from "vitest";
import {
  emitPresencePrimitiveV1,
  emitMicListenPrimitiveV1,
  evaluatePresencePrimitiveOnPulseV1,
  PRESENCE_PRIMITIVE_ACT_V1,
  getPresencePrimitiveSnapshotV1,
  __resetPresencePrimitiveForTestV1
} from "../rhizohPresencePrimitiveV1.js";
import { __resetLiveLayerForTestV0, __setLastLiveEmitAtMsForTestV0 } from "../rhizohLiveLayerV0.js";
import { __resetThinkingLayerForTestV0 } from "../rhizohThinkingLayerV0.js";
import { CONTINUITY_STATE_V0 } from "../rhizohContinuityKernelV0.js";

describe("rhizohPresencePrimitiveV1", () => {
  beforeEach(() => {
    __resetPresencePrimitiveForTestV1();
    __resetLiveLayerForTestV0();
    __resetThinkingLayerForTestV0();
  });

  it("boot_ready emits via live layer", () => {
    const out = emitPresencePrimitiveV1(PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY, { speak: false });
    expect(out?.ok).toBe(true);
    expect(out?.live?.layer).toBe("live");
    expect(getPresencePrimitiveSnapshotV1().bootFired).toBe(true);
  });

  it("mic_listen throttles repeat", () => {
    const a = emitMicListenPrimitiveV1({ traceId: "t1" });
    const b = emitMicListenPrimitiveV1({ traceId: "t2" });
    expect(a?.ok).toBe(true);
    expect(b?.ok).toBe(false);
  });

  it("pulse seq 1 triggers boot primitive", () => {
    const out = evaluatePresencePrimitiveOnPulseV1({ seq: 1, continuity: { state: "idle" } });
    expect(out?.ok).toBe(true);
    expect(out?.act).toBe(PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY);
  });

  it("idle_alive when listening and stale live emit", () => {
    emitPresencePrimitiveV1(PRESENCE_PRIMITIVE_ACT_V1.BOOT_READY, { speak: false, force: true });
    __setLastLiveEmitAtMsForTestV0(Date.now() - 130_000);
    const out = evaluatePresencePrimitiveOnPulseV1({
      seq: 5,
      continuity: { state: CONTINUITY_STATE_V0.LISTENING },
      eventLogCount: 0
    });
    expect(out?.ok).toBe(true);
    expect(out?.act).toBe(PRESENCE_PRIMITIVE_ACT_V1.IDLE_ALIVE);
  });
});
