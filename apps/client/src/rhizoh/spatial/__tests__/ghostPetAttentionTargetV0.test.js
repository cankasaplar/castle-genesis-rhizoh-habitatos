import { describe, expect, it } from "vitest";
import {
  resolveGhostPetAttentionTargetV0,
  GHOST_PET_ATTENTION_TARGET_SCHEMA_V0
} from "../ghostPetAttentionTargetV0.js";

describe("resolveGhostPetAttentionTargetV0", () => {
  it("targets active speaker when focus differs from operator", () => {
    const a = resolveGhostPetAttentionTargetV0(
      { rhizohCastleRuntimeRole: "GUIDE", castlePeersHead: [{ id: "peer1" }] },
      { operatorUserId: "op1", focusUserId: "peer1" }
    );
    expect(a.schema).toBe(GHOST_PET_ATTENTION_TARGET_SCHEMA_V0);
    expect(a.mode).toBe("ACTIVE_SPEAKER");
    expect(a.primaryUid).toBe("peer1");
    expect(a.secondaryUid).toBe("op1");
    expect(typeof a.yawOffsetRad).toBe("number");
  });

  it("uses OWNER_PROXIMITY when focus is operator", () => {
    const a = resolveGhostPetAttentionTargetV0({}, { operatorUserId: "op1", focusUserId: "op1" });
    expect(a.mode).toBe("OWNER_PROXIMITY");
    expect(a.primaryUid).toBe("op1");
    expect(a.yawOffsetRad).toBe(0);
  });

  it("INTERPRETER_SPLIT when role is interpreter and another peer exists", () => {
    const a = resolveGhostPetAttentionTargetV0(
      { rhizohCastleRuntimeRole: "INTERPRETER", castlePeersHead: [{ id: "op1" }, { id: "peer9" }] },
      { operatorUserId: "op1", focusUserId: "" }
    );
    expect(a.mode).toBe("INTERPRETER_SPLIT");
    expect(a.primaryUid).toBe("op1");
    expect(a.secondaryUid).toBe("peer9");
  });

  it("prioritizes recent joiner when provided", () => {
    const a = resolveGhostPetAttentionTargetV0(
      {},
      { operatorUserId: "op1", focusUserId: "op1", recentJoinerUserId: "join99" }
    );
    expect(a.mode).toBe("NEW_JOINER");
    expect(a.primaryUid).toBe("join99");
  });
});
