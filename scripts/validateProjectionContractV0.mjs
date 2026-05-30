/**
 * Projection Contract v0 — self-test (no Vitest worker; safe for constrained CI / Windows).
 * Policy: docs/INTERACTION_GEOMETRY_V0.md §8
 *
 * Run: node scripts/validateProjectionContractV0.mjs
 */

import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const modUrl = pathToFileURL(join(repoRoot, "apps/client/src/rhizoh/interactionGeometry/projectionContractV0.js")).href;

const m = await import(modUrl);

function run() {
  const {
    ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0,
    ALLOWED_DEBUG_CAUSAL_LABELS_V0,
    ALLOWED_RESEARCH_AGGREGATE_KEYS_V0,
    isAllowedProductFormDescriptorV0,
    isAllowedDebugCausalLabelV0,
    mapBurstiness01ToProductDescriptorV0,
    mapLanguageMix01ToProductDescriptorV0,
    projectionCopyLeakageFindingsV0,
    validateResearchAggregateRowV0
  } = m;

  assert.equal(new Set(ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0).size, ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0.length);
  for (const d of ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0) {
    assert.match(d, /^[a-z0-9_]+$/);
  }
  assert.equal(new Set(ALLOWED_DEBUG_CAUSAL_LABELS_V0).size, ALLOWED_DEBUG_CAUSAL_LABELS_V0.length);
  assert.ok(ALLOWED_RESEARCH_AGGREGATE_KEYS_V0.includes("descriptor_histogram"));

  for (const x of [0, 0.32, 0.5, 0.9, 1]) {
    const d = mapBurstiness01ToProductDescriptorV0(x);
    assert.ok(d != null);
    assert.equal(isAllowedProductFormDescriptorV0(d), true);
  }
  assert.equal(mapBurstiness01ToProductDescriptorV0(NaN), null);

  for (const x of [0, 0.4, 0.7, 1]) {
    const d = mapLanguageMix01ToProductDescriptorV0(x);
    assert.ok(d != null);
    assert.equal(isAllowedProductFormDescriptorV0(d), true);
  }

  assert.equal(isAllowedProductFormDescriptorV0("impulsive_user"), false);
  assert.equal(isAllowedDebugCausalLabelV0("user_is_lazy"), false);

  assert.ok(projectionCopyLeakageFindingsV0("the user is a careful planner.").some((x) => x.ruleId === "en_user_is_a"));
  assert.ok(projectionCopyLeakageFindingsV0("Burst → impulsive user pattern.").some((x) => x.ruleId === "en_impulsive_user"));
  assert.ok(projectionCopyLeakageFindingsV0("Kullanıcının kişiliği sakin görünüyor.").some((x) => x.ruleId === "tr_kullanici_kisilik"));

  const okCopy =
    "This session exhibits turn_pacing_dense and language_mix_moderate (non-authoritative telemetry).";
  assert.deepEqual(projectionCopyLeakageFindingsV0(okCopy), []);

  const good = validateResearchAggregateRowV0({
    sample_count: 12,
    turn_count: 40,
    mean_recall_proxy: 0.2,
    mean_language_mix_proxy: 0.5,
    descriptor_histogram: { turn_pacing_calm: 3, turn_pacing_dense: 1 }
  });
  assert.equal(good.ok, true);

  const badKey = validateResearchAggregateRowV0({ user_trait_score: 1 });
  assert.equal(badKey.ok, false);

  const badHist = validateResearchAggregateRowV0({
    sample_count: 1,
    descriptor_histogram: { impulsive_user: 2 }
  });
  assert.equal(badHist.ok, false);
}

try {
  run();
  console.log("[PROJECTION_CONTRACT_V0] ok");
} catch (e) {
  console.error("[PROJECTION_CONTRACT_V0] failed:", e?.message || e);
  process.exit(1);
}
