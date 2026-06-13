import { describe, expect, it, beforeEach } from "vitest";
import { encryptFer1JsonV0, decryptFer1JsonV0 } from "../fer1VaultCryptoV0.js";
import {
  collectFer1VaultPlaintextV0,
  getFer1VaultStatusV0,
  isFer1VaultSealedV0,
  resetFer1MemoryVaultForTestV0,
  sealFer1MemoryVaultV0,
  unsealFer1MemoryVaultV0
} from "../fer1MemoryVaultV0.js";
import { RHIZOH_KNOWLEDGE_LS_KEY_V0 } from "../rhizohKnowledgeStoreV0.js";
import { GHOST_MEMORY_LS_KEY_V0 } from "../ghostMemoryPersistenceV0.js";

describe("fer1VaultCryptoV0", () => {
  it("round-trips JSON with AES-GCM", async () => {
    const payload = { schema: "test", buckets: { knowledge: '{"entries":[]}' } };
    const encrypted = await encryptFer1JsonV0(payload, "castle-secret");
    const restored = await decryptFer1JsonV0(encrypted, "castle-secret");
    expect(restored.buckets.knowledge).toBe('{"entries":[]}');
  });

  it("rejects wrong passphrase", async () => {
    const encrypted = await encryptFer1JsonV0({ ok: true }, "right");
    await expect(decryptFer1JsonV0(encrypted, "wrong")).rejects.toThrow();
  });
});

describe("fer1MemoryVaultV0", () => {
  beforeEach(() => {
    resetFer1MemoryVaultForTestV0();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        RHIZOH_KNOWLEDGE_LS_KEY_V0,
        JSON.stringify({ entries: [{ id: "k1", question: "Q", answer: "A" }] })
      );
      window.localStorage.setItem(
        GHOST_MEMORY_LS_KEY_V0,
        JSON.stringify({ schema: "castle.ghost_memory.v0", ghostId: "g1", memories: [], relationships: [] })
      );
    }
  });

  it("seals and clears plain localStorage buckets", async () => {
    expect(collectFer1VaultPlaintextV0().populated).toBeGreaterThan(0);
    const sealed = await sealFer1MemoryVaultV0("rhizoh-vault-pass");
    expect(sealed.ok).toBe(true);
    expect(isFer1VaultSealedV0()).toBe(true);
    expect(window.localStorage.getItem(RHIZOH_KNOWLEDGE_LS_KEY_V0)).toBeNull();
    expect(getFer1VaultStatusV0().sealed).toBe(true);
  });

  it("unseals with correct passphrase", async () => {
    await sealFer1MemoryVaultV0("rhizoh-vault-pass");
    const opened = await unsealFer1MemoryVaultV0("rhizoh-vault-pass");
    expect(opened.ok).toBe(true);
    expect(opened.restored).toBeGreaterThan(0);
    expect(isFer1VaultSealedV0()).toBe(false);
    expect(window.localStorage.getItem(RHIZOH_KNOWLEDGE_LS_KEY_V0)).toBeTruthy();
  });
});
