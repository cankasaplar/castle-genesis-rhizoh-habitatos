import { describe, expect, it } from "vitest";
import {
  isFoxAnchorSpeciesV0,
  resolveConversationAnchorSpeciesIdV0
} from "../conversationAnchorSpeciesV0.js";

describe("conversationAnchorSpeciesV0", () => {
  it("defaults the conversation anchor to Fox", () => {
    const species = resolveConversationAnchorSpeciesIdV0();
    expect(species).toBe("fox_v1");
    expect(isFoxAnchorSpeciesV0(species)).toBe(true);
  });
});
