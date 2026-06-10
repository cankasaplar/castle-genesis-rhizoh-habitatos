import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  formatFoxIdentityExplainReplyV0,
  formatFoxNamingDeferReplyV0,
  parseFoxNameProposalV0,
  probeFoxIdentityQueryV0,
  resolveFoxIdentityPrecheckV0,
  FOX_NAMING_STATUS_V0
} from "../rhizohFoxIdentityExplainV0.js";
import { runFastPrecheckFromTextV0 } from "../rhizohFastPrecheckV0.js";

describe("probeFoxIdentityQueryV0", () => {
  it("detects who is the fox", () => {
    const hit = probeFoxIdentityQueryV0("Bu tilki kim?");
    expect(hit.active).toBe(true);
    expect(hit.kind).toBe("explain");
  });

  it("detects fox naming intent", () => {
    const hit = probeFoxIdentityQueryV0("Tilkiye isim vermek istiyorum");
    expect(hit.active).toBe(true);
    expect(hit.kind).toBe("naming");
  });

  it("ignores rhizoh self intro without fox", () => {
    const hit = probeFoxIdentityQueryV0("Rhizoh sen kimsin?");
    expect(hit.active).toBe(false);
  });
});

describe("parseFoxNameProposalV0", () => {
  it("parses explicit fox name proposal", () => {
    expect(parseFoxNameProposalV0("Tilkinin adını Rehber koy")).toBe("Rehber");
  });
});

describe("formatFoxIdentityExplainReplyV0", () => {
  it("includes yoldaşım framing in Turkish", () => {
    const reply = formatFoxIdentityExplainReplyV0("tr");
    expect(reply).toMatch(/yoldaş/i);
    expect(reply).toMatch(/Seninle konuşan benim/i);
  });
});

describe("resolveFoxIdentityPrecheckV0", () => {
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns explain intent without LLM", () => {
    const hit = resolveFoxIdentityPrecheckV0("bu tilki kim", "Bu tilki kim?", "tr");
    expect(hit?.intent).toBe("fox_identity_explain");
    expect(hit?.reply).toMatch(/yoldaş/i);
  });

  it("reserves proposed fox name on disk", () => {
    const hit = resolveFoxIdentityPrecheckV0(
      "tilkinin adini rehber koy",
      "Tilkinin adını Rehber koy",
      "tr"
    );
    expect(hit?.intent).toBe("fox_naming_reserved");
    const disk = JSON.parse(localStorage.getItem("rhizoh.continuity.v1") || "{}");
    expect(disk.persona?.foxPreferredName).toBe("Rehber");
    expect(disk.persona?.foxNamingStatus).toBe(FOX_NAMING_STATUS_V0.RESERVED);
  });
});

describe("runFastPrecheckFromTextV0 fox path", () => {
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("bypasses LLM for bu tilki kim", () => {
    const hit = runFastPrecheckFromTextV0("Bu tilki kim?");
    expect(hit?.intent).toBe("fox_identity_explain");
    expect(hit?.llmBypass).toBe(true);
  });

  it("defers naming without proposal copy", () => {
    const hit = runFastPrecheckFromTextV0("Fox'a isim verelim mi?");
    expect(hit?.intent).toBe("fox_naming_defer");
    expect(formatFoxNamingDeferReplyV0("tr")).toMatch(/Şimdilik isme gerek yok/);
  });
});
