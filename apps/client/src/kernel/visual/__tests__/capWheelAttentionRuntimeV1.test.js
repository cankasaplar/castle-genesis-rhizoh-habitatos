import { describe, expect, it, vi } from "vitest";
import {
  CAP_WHEEL_INTERACTION_PHASE_V1,
  createCapWheelAttentionSessionV1,
  recordCapWheelClickExecuteV1,
  recordCapWheelClickPendingV1,
  recordCapWheelHoverDecodeV1,
  recordCapWheelInteractionIdleV1,
  scheduleCapWheelExecuteAfterDecodeV1
} from "../capWheelAttentionRuntimeV1.js";

describe("capWheelAttentionRuntimeV1", () => {
  it("orders hover decode before click execute in session log", () => {
    let session = createCapWheelAttentionSessionV1();
    session = recordCapWheelHoverDecodeV1(session, { nodeId: "explore" });
    session = recordCapWheelClickPendingV1(session, { nodeId: "explore" });
    session = recordCapWheelClickExecuteV1(session, { nodeId: "explore" });
    session = recordCapWheelInteractionIdleV1(session);
    expect(session.events.map((e) => e.type)).toEqual([
      "hover_decode",
      "click_pending",
      "click_execute",
      "idle"
    ]);
    expect(session.phase).toBe(CAP_WHEEL_INTERACTION_PHASE_V1.IDLE);
  });

  it("scheduleCapWheelExecuteAfterDecodeV1 defers execution past sync turn", async () => {
    vi.useFakeTimers();
    const order = [];
    order.push("sync");
    scheduleCapWheelExecuteAfterDecodeV1(() => order.push("execute"));
    order.push("after_schedule");
    expect(order).toEqual(["sync", "after_schedule"]);
    await vi.runAllTimersAsync();
    expect(order).toContain("execute");
    vi.useRealTimers();
  });

  it("caps ephemeral event log", () => {
    let session = createCapWheelAttentionSessionV1();
    for (let i = 0; i < 40; i++) {
      session = recordCapWheelHoverDecodeV1(session, { nodeId: `n${i}` });
    }
    expect(session.events.length).toBeLessThanOrEqual(32);
  });
});
