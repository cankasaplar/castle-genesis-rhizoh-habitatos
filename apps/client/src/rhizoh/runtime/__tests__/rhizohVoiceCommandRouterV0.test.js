import { describe, expect, it, beforeEach } from "vitest";
import {
  classifyVoiceIntentV0,
  executeLocalVoiceCommandV0,
  normalizeVoiceCommandSpaceV0,
  routeVoiceInputV0,
  VOICE_INTENT_TYPE_V0,
  VOICE_ROUTE_EXECUTION_V0
} from "../rhizohVoiceCommandRouterV0.js";
import {
  __resetOlpStateForTestV0,
  hydrateOlpFromPersistedPreferenceV0
} from "../rhizohOutputLanguagePolicyV0.js";

describe("rhizohVoiceCommandRouterV0", () => {
  beforeEach(() => {
    __resetOlpStateForTestV0();
    localStorage.setItem("rhizoh.user.language.v0", "en");
    hydrateOlpFromPersistedPreferenceV0();
  });

  it("maps TR stop slang to canonical stop_listening (not bare stop → media)", () => {
    const space = normalizeVoiceCommandSpaceV0("tamam dur");
    expect(space.canonical).toBe("stop_listening");
    expect(normalizeVoiceCommandSpaceV0("stop").canonical).toBe("media_stop");
    const intent = classifyVoiceIntentV0("tamam dur");
    expect(intent.type).toBe(VOICE_INTENT_TYPE_V0.COMMAND);
    expect(intent.localOnly).toBe(true);
  });

  it("routes open questions to LLM not local registry", () => {
    const route = routeVoiceInputV0("explain quantum physics briefly");
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.LLM);
  });

  it("routes grammar local surface before LLM", () => {
    const route = routeVoiceInputV0("dünya");
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.LOCAL);
    expect(route.grammarLocal?.kind).toBe("ENTER_SURFACE");
  });

  it("routes haritayı aç as local map command (no LLM)", () => {
    const route = routeVoiceInputV0("haritayı aç");
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.LOCAL);
    expect(route.canonical).toBe("map_open");
  });

  it("routes kale oluştur as local castle create command (no LLM)", () => {
    const route = routeVoiceInputV0("kale oluştur");
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.LOCAL);
    expect(route.canonical).toBe("castle_create");
  });

  it("executes CASTLE_CREATE grammar with castle init gate side effect", () => {
    const events = [];
    window.addEventListener("castle:open-init-gate-v0", () => events.push("gate"));
    const route = routeVoiceInputV0("rhizoh kale kur");
    expect(route.execution).toBe(VOICE_ROUTE_EXECUTION_V0.LOCAL);
    executeLocalVoiceCommandV0(route);
    expect(events).toContain("gate");
  });

  it("castle_create registry uses lifecycle handler (not map spatial)", () => {
    const mapEvents = [];
    const gateEvents = [];
    window.addEventListener("rhizoh:map-command", () => mapEvents.push("map"));
    window.addEventListener("castle:open-init-gate-v0", () => gateEvents.push("gate"));
    const route = routeVoiceInputV0("kale kur");
    expect(route.canonical).toBe("castle_create");
    executeLocalVoiceCommandV0(route);
    expect(gateEvents).toContain("gate");
    expect(mapEvents).toHaveLength(0);
  });

  it("strips trailing punctuation for registry match", () => {
    expect(normalizeVoiceCommandSpaceV0("kale kur.").canonical).toBe("castle_create");
  });
});
