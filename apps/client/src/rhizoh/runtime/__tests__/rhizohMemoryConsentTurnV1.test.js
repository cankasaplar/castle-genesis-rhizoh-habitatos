import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  tryResolveMemoryConsentTurnV1,
  readPendingMemoryInvitationV1,
  formatMemoryConsentAckReplyV1
} from "../rhizohMemoryConsentTurnV1.js";
import { stageSpatialMemoryInvitationV1, SPATIAL_MEMORY_STORAGE_KEY_V1 } from "../rhizohSpatialMemoryAnchorV1.js";
import { postRhizohLlmTurnV0 } from "../rhizohLlmTurnClientV0.js";

describe("tryResolveMemoryConsentTurnV1", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {},
      getItem(k) {
        return this.store[k] ?? null;
      },
      setItem(k, v) {
        this.store[k] = v;
      }
    });
    vi.stubGlobal("window", {
      localStorage: globalThis.localStorage,
      dispatchEvent: vi.fn(),
      __rhizoh: {}
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when no pending invitation", () => {
    expect(tryResolveMemoryConsentTurnV1("evet")).toBeNull();
  });

  it("commits spatial anchor on evet without LLM", () => {
    stageSpatialMemoryInvitationV1({
      message: "onumuzdeki hafta is gorusmem var",
      significanceField: { score: 0.82, goalImpact: 0.7 },
      traceId: "TRC-1"
    });
    expect(readPendingMemoryInvitationV1()?.tier).toBe("spatial_anchor");

    const hit = tryResolveMemoryConsentTurnV1("evet not al", { traceId: "TRC-1", locale: "tr" });
    expect(hit?.llmBypass).toBe(true);
    expect(hit?.source).toBe("memory_consent_spatial_committed");
    expect(hit?.reply).toMatch(/gelecek işareti/i);
    expect(readPendingMemoryInvitationV1()).toBeNull();
  });

  it("declines without persisting anchor", () => {
    stageSpatialMemoryInvitationV1({
      message: "onumuzdeki hafta is gorusmem var",
      significanceField: { score: 0.82, goalImpact: 0.7 }
    });
    const hit = tryResolveMemoryConsentTurnV1("hayır gerek yok", { locale: "tr" });
    expect(hit?.source).toBe("memory_consent_declined");
    expect(hit?.reply).toMatch(/kaydetmiyorum/i);
    expect(JSON.parse(localStorage.getItem(SPATIAL_MEMORY_STORAGE_KEY_V1)).anchors).toEqual([]);
  });
});

describe("postRhizohLlmTurnV0 consent short-circuit", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {},
      getItem(k) {
        return this.store[k] ?? null;
      },
      setItem(k, v) {
        this.store[k] = v;
      }
    });
    vi.stubGlobal("window", {
      localStorage: globalThis.localStorage,
      dispatchEvent: vi.fn()
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("bypasses gateway fetch when consent pending", async () => {
    stageSpatialMemoryInvitationV1({
      message: "onumuzdeki hafta is gorusmem var",
      significanceField: { score: 0.82, goalImpact: 0.7 }
    });
    const fetchMock = vi.fn();
    const out = await postRhizohLlmTurnV0({
      message: "evet",
      skipHotWire: true,
      fetchImpl: fetchMock
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(out.ok).toBe(true);
    expect(out.llmBypass).toBe(true);
    expect(out.consentStatus).toBe("granted");
  });
});

describe("formatMemoryConsentAckReplyV1", () => {
  it("formats Turkish grant copy", () => {
    expect(formatMemoryConsentAckReplyV1("tr", "granted", { label: "Görüşme" })).toMatch(/Görüşme/);
  });
});
