import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertInterpretationUxContractV1 } from "../ops/interpretationUxContractV1.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("interpretationUxContractV1", () => {
  it("passes on full narrative export", async () => {
    const n = await buildUnifiedStateNarrativeV0({ dau: 500, tenantCount: 2, platformScope: true });
    assert.equal(assertInterpretationUxContractV1(n), true);
    assert.ok(n.interpretationUxContract?.narrativeNeverVisuallyDominant);
  });
});
