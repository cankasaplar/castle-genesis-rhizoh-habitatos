import { describe, expect, it } from "vitest";
import {
  createFixedTimestepAccumulatorV0,
  pumpFixedTimestepV0,
  createRollbackQueueV0,
  pushRollbackQueueV0,
  rewindRollbackQueueV0
} from "../lib/realSimulation/fixedTimestepIntegratorV0";

describe("fixedTimestepIntegratorV0", () => {
  it("pumps capped fixed steps", () => {
    const acc = createFixedTimestepAccumulatorV0(16);
    expect(pumpFixedTimestepV0(acc, 50, 5)).toBe(3);
    expect(acc.accMs).toBeGreaterThanOrEqual(0);
    expect(acc.accMs).toBeLessThan(16);
  });

  it("rollback queue rewinds", () => {
    const q = createRollbackQueueV0<number>(10);
    pushRollbackQueueV0(q, 1);
    pushRollbackQueueV0(q, 2);
    pushRollbackQueueV0(q, 3);
    expect(rewindRollbackQueueV0(q, 1)).toBe(2);
  });
});
