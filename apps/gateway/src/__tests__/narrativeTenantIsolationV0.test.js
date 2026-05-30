import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertNarrativeTenantIsolationV0,
  assertTenantScopedDerivedInvariantV0,
  computeNarrativeFingerprintV0,
  normalizeTenantIdV0,
  PLATFORM_TENANT_ID_V0,
  resolveNarrativeTenantScopeV0
} from "../ops/narrativeTenantIsolationV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";

describe("narrativeTenantIsolationV0", () => {
  it("rejects missing tenant scope when platform disabled", () => {
    assert.throws(
      () => resolveNarrativeTenantScopeV0({ platformScope: false }),
      /tenantId_or_platformScope/
    );
  });

  it("normalizes valid tenant ids", () => {
    assert.equal(normalizeTenantIdV0("org-1"), "org-1");
  });

  it("builds distinct tenant-scoped narratives", async () => {
    const a = await buildUnifiedStateNarrativeV0({
      tenantId: "org-a-test",
      tenantIsolationProbe: "PROBE_A_TEST_ONLY"
    });
    const b = await buildUnifiedStateNarrativeV0({
      tenantId: "org-b-test",
      tenantIsolationProbe: "PROBE_B_TEST_ONLY"
    });

    assertTenantScopedDerivedInvariantV0(a);
    assertTenantScopedDerivedInvariantV0(b);
    assert.notEqual(a.narrativeFingerprint.digest, b.narrativeFingerprint.digest);
    assertNarrativeTenantIsolationV0(a, b);
    assert.ok(a.screenshotScopeWatermark.lines.en.includes("org-a-test"));
  });

  it("platform scope uses __platform__ tenant id", async () => {
    const p = await buildUnifiedStateNarrativeV0({ platformScope: true });
    assert.equal(p.tenantScope.tenantId, PLATFORM_TENANT_ID_V0);
    assert.equal(p.stateLayers.derived.globalDerivedState, false);
    const fp = computeNarrativeFingerprintV0(p);
    assert.equal(fp.algorithm, "sha256");
  });
});
