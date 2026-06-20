import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAuthorityEpochIdV1,
  mintAuthorityEpochIdV1,
  resetAuthorityEpochForTestV1
} from "../authorityEpochBoundaryV1.js";

vi.mock("../../useRhizohGatewayMonitor.js", () => ({
  getOrCreateCastleDevUid: () => "dev-epoch-test"
}));

describe("authorityEpochBoundaryV1", () => {
  beforeEach(() => {
    resetAuthorityEpochForTestV1();
  });

  it("mints deterministic epoch id from bootAtMs + clientSeed", () => {
    const a = mintAuthorityEpochIdV1({ bootAtMs: 1000, clientSeed: "seed-a" });
    const b = mintAuthorityEpochIdV1({ bootAtMs: 1000, clientSeed: "seed-a" });
    expect(a.epochId).toMatch(/^h[0-9a-f]{8}$/);
    expect(a.epochId).toBe(b.epochId);
  });

  it("changes epoch id when bootAtMs changes", () => {
    const a = mintAuthorityEpochIdV1({ bootAtMs: 1000, clientSeed: "seed-a" });
    resetAuthorityEpochForTestV1();
    const b = mintAuthorityEpochIdV1({ bootAtMs: 2000, clientSeed: "seed-a" });
    expect(a.epochId).not.toBe(b.epochId);
  });

  it("getAuthorityEpochIdV1 auto-mints when unset", () => {
    expect(getAuthorityEpochIdV1()).toMatch(/^h[0-9a-f]{8}$/);
  });
});
