import { describe, expect, it } from "vitest";
import {
  applyAddressingFromUserMessageV0,
  parsePreferredAddressFromTextV0,
  resolveRhizohEffectivePersonaV0
} from "../rhizohPersonaAddressingV0.js";
import { probeSportsLiveQueryV0, filterSportMatchesForTeamV0 } from "../rhizohSportsLiveContextV0.js";

describe("parsePreferredAddressFromTextV0", () => {
  it("parses bana X de", () => {
    expect(parsePreferredAddressFromTextV0("Bana Can de lütfen")?.firstName).toBe("Can");
  });

  it("parses self introduction", () => {
    expect(parsePreferredAddressFromTextV0("Benim adım Ayşe")?.firstName).toBe("Ayşe");
  });
});

describe("resolveRhizohEffectivePersonaV0", () => {
  it("does not expose auth name before confirmation", () => {
    const p = resolveRhizohEffectivePersonaV0({}, {
      authFirstName: "Can",
      conversationPhase: "INTRO",
      userTurnCount: 1
    });
    expect(p.firstName).toBe("");
    expect(p.needsAddressingPrompt).toBe(true);
    expect(p.mayUseNameInReply).toBe(false);
  });

  it("uses disk preference after user confirms", () => {
    const p = resolveRhizohEffectivePersonaV0(
      { firstName: "Can", preferredAddress: "Can", addressingConfirmed: true },
      { authFirstName: "Cankasaplar", conversationPhase: "INTRO", userTurnCount: 2 }
    );
    expect(p.firstName).toBe("Can");
    expect(p.needsAddressingPrompt).toBe(false);
    expect(p.mayUseNameInReply).toBe(true);
  });
});

describe("applyAddressingFromUserMessageV0", () => {
  it("persists addressing patch", () => {
    const next = applyAddressingFromUserMessageV0("Bana Can de", {});
    expect(next?.preferredAddress).toBe("Can");
    expect(next?.addressingConfirmed).toBe(true);
  });
});

describe("probeSportsLiveQueryV0", () => {
  it("detects Turkey fixture questions", () => {
    const hit = probeSportsLiveQueryV0("Türkiye'nin maç fikstürü nedir?");
    expect(hit.active).toBe(true);
    expect(hit.team).toBe("turkey");
  });

  it("filters turkey matches", () => {
    const rows = filterSportMatchesForTeamV0(
      [
        { homeName: "Turkey", awayName: "Germany" },
        { homeName: "Barcelona", awayName: "Real Madrid" }
      ],
      "turkey"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].homeName).toBe("Turkey");
  });
});
