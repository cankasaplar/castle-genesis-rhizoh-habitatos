import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetShadowSessionGraphForTestV0,
  addSessionEdgeV0,
  SESSION_EDGE_KIND_V0,
  listSessionEdgesV0
} from "../shadowCastleSessionGraphV0.js";

describe("shadowCastleSessionGraphV0", () => {
  beforeEach(() => {
    __resetShadowSessionGraphForTestV0();
  });

  it("addSessionEdgeV0 records visit edge with remote pin id", () => {
    const edge = addSessionEdgeV0({
      fromCastleId: "my_castle",
      toUid: "abc",
      edgeKind: SESSION_EDGE_KIND_V0.VISIT
    });
    expect(edge.toCastleId).toBe("remote_castle_abc");
    expect(edge.interpretationOnly).toBe(true);
    expect(listSessionEdgesV0(4)).toHaveLength(1);
  });
});
