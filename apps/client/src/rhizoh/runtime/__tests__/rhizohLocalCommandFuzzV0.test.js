import { describe, expect, it, beforeEach } from "vitest";
import {
  RHIZOH_LOCAL_COMMAND_REGISTRY_V0,
  buildLocalCommandAliasIndexV0
} from "../rhizohLocalCommandRegistryV0.js";
import {
  normalizeVoiceCommandTokenV0,
  routeVoiceInputV0,
  VOICE_ROUTE_EXECUTION_V0
} from "../rhizohVoiceCommandRouterV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohLocalCommandFuzzV0 — registry must not fall through to LLM", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("all registry aliases route LOCAL (no LLM leak)", () => {
    const leaks = [];
    const idx = buildLocalCommandAliasIndexV0(normalizeVoiceCommandTokenV0);
    const seen = new Set();
    for (const [alias, canonical] of idx.entries()) {
      if (seen.has(alias)) continue;
      seen.add(alias);
      const route = routeVoiceInputV0(alias);
      if (route.execution !== VOICE_ROUTE_EXECUTION_V0.LOCAL) {
        leaks.push({ alias, canonical, execution: route.execution });
      }
    }
    expect(leaks).toEqual([]);
  });

  it("reports registry size for ops", () => {
    expect(Object.keys(RHIZOH_LOCAL_COMMAND_REGISTRY_V0).length).toBeGreaterThanOrEqual(50);
  });
});
