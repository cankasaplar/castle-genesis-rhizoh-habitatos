import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ANCHOR_SYSTEM_BINDING_SENTENCE_V0,
  ANCHOR_SYSTEM_PRODUCT_SPINE_V0,
  ANCHOR_TYPE_ORIGIN_SEED_V0,
  ANCHOR_TYPE_USER_V0,
  buildLifeContinuityContextHintsV0,
  establishUserAnchorIfAbsentV0,
  observeAnchorBalanceFieldV0,
  getOriginSeedAnchorV0,
  resolvePrimaryAnchorSourceV0,
  mergeCohortAnchorV0,
  mergePalIntoAnchorContextV0,
  readUserAnchorV0,
  resetMemoryAnchorSessionV0,
  resolveDisplayAnchorV0
} from "../memoryAnchorSystemV0.js";

describe("memoryAnchorSystemV0", () => {
  beforeEach(() => {
    resetMemoryAnchorSessionV0();
  });

  afterEach(() => {
    resetMemoryAnchorSessionV0();
  });

  it("exposes immutable origin seed", () => {
    const origin = getOriginSeedAnchorV0();
    expect(origin.type).toBe(ANCHOR_TYPE_ORIGIN_SEED_V0);
    expect(origin.immutable).toBe(true);
    expect(origin.role).toBe("semantic_gravity_seed");
    expect(origin.label).toMatch(/Serencebey/i);
  });

  it("locks SSOT binding and product spine", () => {
    expect(ANCHOR_SYSTEM_BINDING_SENTENCE_V0).toContain("emerge within");
    expect(ANCHOR_SYSTEM_PRODUCT_SPINE_V0).toMatch(/seeds continuities/i);
  });

  it("establishes user anchor once then versions stay stable", () => {
    const first = establishUserAnchorIfAbsentV0({
      threadId: "thr_abc",
      messageExcerpt: "ilk anlamlı bağ",
      palLabel: "Personal Castle"
    });
    expect(first.created).toBe(true);
    expect(first.anchor?.type).toBe(ANCHOR_TYPE_USER_V0);

    const second = establishUserAnchorIfAbsentV0({
      threadId: "thr_other",
      messageExcerpt: "should not replace"
    });
    expect(second.created).toBe(false);
    expect(readUserAnchorV0()?.thread_id).toBe("thr_abc");
  });

  it("merges cohort anchor without deleting previous", () => {
    mergeCohortAnchorV0({ cohortId: "cohort_a", label: "Cluster A" });
    const merged = mergeCohortAnchorV0({ cohortId: "cohort_b", label: "Cluster B" });
    expect(merged.label).toBe("Cluster B");
    expect(merged.previous?.label).toBe("Cluster A");
  });

  it("resolveDisplayAnchor prefers user over origin seed", () => {
    establishUserAnchorIfAbsentV0({ threadId: "t1", palLabel: "My thread origin" });
    const display = resolveDisplayAnchorV0();
    expect(display.primary_label).toBe("My thread origin");
    expect(display.origin_seed_label).toMatch(/Serencebey/i);
    expect(display.label).toBe(display.primary_label);
  });

  it("buildLifeContinuityContextHints includes origin seed id", () => {
    establishUserAnchorIfAbsentV0({ threadId: "thr_lc", palLabel: "Coherence" });
    const hints = buildLifeContinuityContextHintsV0();
    expect(hints.origin_seed_id).toBe(getOriginSeedAnchorV0().anchor_id);
    expect(hints.thread_id).toBe("thr_lc");
    expect(hints.anchor_label).toBe("Coherence");
  });

  it("resolvePrimaryAnchorSource respects priority", () => {
    expect(resolvePrimaryAnchorSourceV0({ visible: true, label: "PAL" }, { label: "User" }, null)).toBe(
      "pal"
    );
    expect(resolvePrimaryAnchorSourceV0(null, { label: "User" }, { label: "Cohort" })).toBe("user");
    expect(resolvePrimaryAnchorSourceV0(null, null, { label: "Cohort" })).toBe("cohort");
    expect(resolvePrimaryAnchorSourceV0(null, null, null)).toBe("seed");
  });

  it("observeAnchorBalanceField returns observation-only snapshot", () => {
    mergePalIntoAnchorContextV0(
      { label: "X", visible: true },
      { kind: "message_arrive" }
    );
    const obs = observeAnchorBalanceFieldV0();
    expect(obs.observation_only).toBe(true);
    expect(obs.balance.sampleCount).toBeGreaterThan(0);
  });

  it("mergePalIntoAnchorContext writes display cache", () => {
    mergePalIntoAnchorContextV0(
      { label: "PAL Castle", memory_anchor: "Bağlandığın yer: PAL Castle", visible: true },
      { kind: "message_arrive", threadId: "thr_pal" }
    );
    const cached = resolveDisplayAnchorV0();
    expect(cached.primary_label).toBe("PAL Castle");
    expect(cached.last_event).toBe("message_arrive");
  });
});
