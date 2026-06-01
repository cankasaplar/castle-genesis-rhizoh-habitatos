import { describe, expect, it } from "vitest";
import {
  LOCAL_AUTHORITY_LOCAL_V0,
  LOCAL_AUTHORITY_REMOTE_V0,
  resolveLocalActionAuthorityV0
} from "../rhizohLocalActionAuthorityV0.js";

describe("rhizohLocalActionAuthorityV0", () => {
  it("routes studio ya geç locally without LLM", () => {
    const r = resolveLocalActionAuthorityV0("studio ya geç");
    expect(r.authority).toBe(LOCAL_AUTHORITY_LOCAL_V0);
    expect(r.kind).toBe("ENTER_SURFACE");
    expect(r.surface).toBe("studio");
    expect(r.user_reply_tr).toMatch(/Stüdyo açıldı/);
  });

  it("routes bare dünya locally", () => {
    const r = resolveLocalActionAuthorityV0("dünya");
    expect(r.authority).toBe(LOCAL_AUTHORITY_LOCAL_V0);
    expect(r.surface).toBe("world");
  });

  it("routes open question to remote LLM", () => {
    const r = resolveLocalActionAuthorityV0("İstanbul'da bugün hava nasıl ve neden önemli?");
    expect(r.authority).toBe(LOCAL_AUTHORITY_REMOTE_V0);
    expect(r.kind).toBe("llm");
  });

  it("routes keşfet to local intent", () => {
    const r = resolveLocalActionAuthorityV0("keşfet");
    expect(r.authority).toBe(LOCAL_AUTHORITY_LOCAL_V0);
    expect(r.kind).toBe("SET_INTENT");
  });
});
