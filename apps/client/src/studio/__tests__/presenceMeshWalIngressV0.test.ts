import { describe, expect, it } from "vitest";
import { ingestPresenceMeshWalV0 } from "../presenceMeshWalIngressV0";

describe("presenceMeshWalIngressV0", () => {
  it("returns structured ingestion result", () => {
    const res = ingestPresenceMeshWalV0({
      meshId: "test"
    });

    expect(res).toBeDefined();

    // FIX: strict typing
    expect(res.ok).toBe(true);
    expect(res.geometryAuthority).toBeDefined();
  });
});
