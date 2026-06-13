import { describe, expect, it } from "vitest";
import { encryptMediaBlobV0, decryptMediaBlobV0 } from "../worldSpaceMediaCryptoV0.js";

describe("worldSpaceMediaCryptoV0", () => {
  it("round-trips blob encryption with AES-GCM", async () => {
    const blob = new Blob(["hello world space archive"], { type: "video/webm" });
    const encrypted = await encryptMediaBlobV0(blob, "test-passphrase");
    expect(encrypted.algo).toBe("AES-GCM");
    expect(encrypted.ciphertextB64).toBeTruthy();
    const decrypted = await decryptMediaBlobV0(encrypted, "test-passphrase");
    const text = await decrypted.text();
    expect(text).toBe("hello world space archive");
  });

  it("rejects wrong passphrase", async () => {
    const blob = new Blob(["secret"], { type: "audio/webm" });
    const encrypted = await encryptMediaBlobV0(blob, "right");
    await expect(decryptMediaBlobV0(encrypted, "wrong")).rejects.toThrow();
  });
});
