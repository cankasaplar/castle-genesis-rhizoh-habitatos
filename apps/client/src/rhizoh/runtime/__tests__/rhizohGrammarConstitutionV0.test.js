import { describe, expect, it } from "vitest";
import {
  evaluateConstitutionMutationV0,
  resolveGrammarFromUtteranceV0,
  RGCS_EVOLUTION_BINDING_SENTENCE_V0
} from "../rhizohGrammarConstitutionV0.js";
import { T0_GRAMMAR_BINDING_SENTENCE_V0 } from "../rhizohT0CognitiveGrammarV0.js";

describe("rhizohT0CognitiveGrammarV0", () => {
  it("exposes locked binding sentence", () => {
    expect(T0_GRAMMAR_BINDING_SENTENCE_V0).toContain("cognitive grammar system");
  });
});

describe("rhizohGrammarConstitutionV0", () => {
  it("rejects new constitution pillars", () => {
    expect(evaluateConstitutionMutationV0("hyper_intent").allowed).toBe(false);
    expect(evaluateConstitutionMutationV0("intent").allowed).toBe(false);
  });

  it("maps studio utterance to ENTER_SURFACE + produce bias", () => {
    const r = resolveGrammarFromUtteranceV0("studio katmanına geçelim");
    expect(r.action).toBe("ENTER_SURFACE");
    expect(r.surface).toBe("studio");
    expect(r.intentBias).toBe("produce");
    expect(r.mutation.allowed).toBe(true);
    expect(r.seal).toBe("dictionary_seal_v0");
  });

  it("maps informal studio ya geç to ENTER_SURFACE", () => {
    const r = resolveGrammarFromUtteranceV0("studio ya geçer misin");
    expect(r.action).toBe("ENTER_SURFACE");
    expect(r.surface).toBe("studio");
  });

  it("maps bare salon to hall surface", () => {
    const r = resolveGrammarFromUtteranceV0("salon");
    expect(r.action).toBe("ENTER_SURFACE");
    expect(r.surface).toBe("hall");
  });

  it("maps harita to OPEN_MAP_TOOL not WORLD replacement", () => {
    const r = resolveGrammarFromUtteranceV0("haritaya geç");
    expect(r.action).toBe("OPEN_MAP_TOOL");
    expect(r.surface).toBe("world");
    expect(r.mapTool).toBe("city_map");
  });

  it("maps küreye geç to OPEN_MAP_TOOL globe", () => {
    const r = resolveGrammarFromUtteranceV0("küreye geç");
    expect(r.action).toBe("OPEN_MAP_TOOL");
    expect(r.mapTool).toBe("globe");
  });

  it("maps istanbul to city_map", () => {
    const r = resolveGrammarFromUtteranceV0("istanbul haritasına geç");
    expect(r.action).toBe("OPEN_MAP_TOOL");
    expect(r.mapTool).toBe("city_map");
  });

  it("maps dünya to ENTER_SURFACE world (GLOBE home)", () => {
    const r = resolveGrammarFromUtteranceV0("dünyaya geç");
    expect(r.action).toBe("ENTER_SURFACE");
    expect(r.surface).toBe("world");
  });

  it("evolution binding sentence is locked", () => {
    expect(RGCS_EVOLUTION_BINDING_SENTENCE_V0).toContain("meaning space");
  });
});
