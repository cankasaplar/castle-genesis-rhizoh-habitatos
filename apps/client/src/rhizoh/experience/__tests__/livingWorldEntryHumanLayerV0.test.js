import { describe, it, expect } from "vitest";
import {
  buildLivingWorldEntryHumanLayerV0,
  buildFtueStoryFlowV0,
  buildActionLoopClosureV0,
  deriveDeploymentPersonaV0,
  buildMentalModelSimplicityV0
} from "../livingWorldEntryHumanLayerV0.js";

describe("livingWorldEntryHumanLayerV0", () => {
  it("FTUE active on first visit with 3 beats", () => {
    const ftue = buildFtueStoryFlowV0({ returning: false, locale: "tr" });
    expect(ftue.active).toBe(true);
    expect(ftue.beats).toHaveLength(3);
    expect(ftue.beats[2].line).toMatch(/Dinle|Observe/i);
  });

  it("FTUE off on return visit", () => {
    const ftue = buildFtueStoryFlowV0({ returning: true, locale: "tr" });
    expect(ftue.active).toBe(false);
  });

  it("mental model is one sentence without RCML jargon", () => {
    const m = buildMentalModelSimplicityV0({ locale: "tr" });
    expect(m.oneLiner).toMatch(/Rhizoh/);
    expect(m.oneLiner).not.toMatch(/entropy|RCML|instanceId/i);
  });

  it("deployment persona adapts to Istanbul timezone", () => {
    const p = deriveDeploymentPersonaV0({
      timeZone: "Europe/Istanbul",
      locale: "tr",
      atmosphereLead: "sabah — açık"
    });
    expect(p.placeSense).toMatch(/İstanbul/i);
    expect(p.greeting).toMatch(/İstanbul|ritim/i);
    expect(p.culturalVariant).toBe("tr_warm");
  });

  it("action loop closure triad", () => {
    const c = buildActionLoopClosureV0({
      action: "observe",
      feedbackLine: "Gözlem izi dünyaya işlendi.",
      locale: "tr"
    });
    expect(c?.did).toMatch(/Dinledin/i);
    expect(c?.changed).toBeTruthy();
    expect(c?.happened).toMatch(/hatırladı|fark/i);
  });

  it("full HEL hides technical meta for first visit", () => {
    const h = buildLivingWorldEntryHumanLayerV0({
      returning: false,
      locale: "tr",
      timeZone: "Europe/Istanbul"
    });
    expect(h.showTechnicalMeta).toBe(false);
    expect(h.continuityHuman.whyHere).not.toMatch(/wi_/);
    expect(h.actionCopy.observe.label).toMatch(/Dinle/i);
  });
});
