/**
 * ECER-ADV-1 — adversarial fixture runner (classify → resolve → gate assert).
 * @see docs/ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md
 *
 *   node scripts/ecerAdversarialSuite.mjs
 *   npm run epistemic:ecer-adversarial
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { classifyDivergence } from "./classifyDivergence.mjs";
import { resolveVClass } from "./resolutionPolicy.mjs";
import { evaluateBindIndexed } from "./evaluateBindIndexed.mjs";
import { buildAdversarialScenarios } from "./fixtures/ecer-adversarial/scenarios.mjs";

async function main() {
  const mod = await import(
    pathToFileURL(resolve(process.cwd(), "scripts/fixtures/mk1-stress-base.mjs")).href
  );
  const { trace, manifest, clock, PI_HASH_TRACE } = mod;

  const ctx = {
    trace,
    manifest,
    clock,
    PI_HASH_TRACE,
    evaluateBindIndexed
  };

  const scenarios = buildAdversarialScenarios(ctx);
  /** @type {Array<{ id: string; ok: boolean; detail?: string }>} */
  const results = [];

  for (const s of scenarios) {
    const c = classifyDivergence(s.classifyFeatures);
    if (c.divergenceClass !== s.expectedDivergenceClass) {
      results.push({
        id: s.id,
        ok: false,
        detail: `classify: got ${c.divergenceClass}, want ${s.expectedDivergenceClass}`
      });
      continue;
    }

    const res = resolveVClass(c.divergenceClass);
    if (res.action !== s.expectedResolutionAction) {
      results.push({
        id: s.id,
        ok: false,
        detail: `resolve: got ${res.action}, want ${s.expectedResolutionAction}`
      });
      continue;
    }

    if (s.runRblWitnessSeal && s.assertRblWitnessSeal) {
      const seal = s.runRblWitnessSeal();
      if (!s.assertRblWitnessSeal(seal)) {
        results.push({
          id: s.id,
          ok: false,
          detail: "RBL witness seal assertion failed"
        });
        continue;
      }
    }

    if (s.runEvaluateBind && s.assertEvaluateBind) {
      const r = s.runEvaluateBind();
      if (!s.assertEvaluateBind(r)) {
        results.push({
          id: s.id,
          ok: false,
          detail: `evaluateBindIndexed assertion failed: ${JSON.stringify({
            piEfcCode: "mk1" in r ? r.piEfcCode : null,
            decisionClass: "mk1" in r ? r.decisionClass : null
          })}`
        });
        continue;
      }
    }

    results.push({ id: s.id, ok: true });
  }

  const pass = results.every((x) => x.ok);
  console.log(JSON.stringify({ pass, results }, null, 2));
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
