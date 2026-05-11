/**
 * ECER-1 — artifact → bind → classify → resolve → judge (minimal wiring smoke).
 * Zorlar: πEFC + PAG + RBL-A1 closure + R1 tablo (executable constitutional path).
 *
 *   node scripts/ecerPipelineSmoke.mjs
 *   npm run epistemic:ecer-smoke
 *
 * Adversarial sınır senaryoları: `npm run epistemic:ecer-adversarial` · [`ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md`](../docs/ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md)
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mk1Validate, DECISION_CLASS } from "./mk1Validate.mjs";
import { evaluateBindIndexed } from "./evaluateBindIndexed.mjs";
import { sealCanonicalAuthorityBundle, LIFECYCLE_STATE } from "./authorityBundle.mjs";
import { classifyDivergence, DIVERGENCE_CLASS } from "./classifyDivergence.mjs";
import { resolveVClass, RESOLUTION_ACTION } from "./resolutionPolicy.mjs";

async function main() {
  const mod = await import(
    pathToFileURL(resolve(process.cwd(), "scripts/fixtures/mk1-stress-base.mjs")).href
  );
  const { trace, manifest, clock, PI_HASH_TRACE } = mod;

  const resolutionPolicyRef = "R1:ecer-smoke:v0";
  const bundle = sealCanonicalAuthorityBundle({
    piHash: PI_HASH_TRACE,
    epochId: "E0",
    governanceConstraintSetId: "GCS:ecer-smoke",
    governanceConstraintHash:
      "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    resolutionPolicyRef,
    resolutionPolicyEpoch: "E0",
    lifecycleState: LIFECYCLE_STATE.ACTIVE,
    authorityWitness: { pipeline: "ecer-1" }
  });

  const manifestAug = {
    ...manifest,
    resolutionPolicyRef,
    governanceConstraintSetId: "GCS:ecer-smoke"
  };

  const matrix = (/** @type {string} */ i, /** @type {string} */ j) =>
    i === j ? "SELF" : "NON_BREAKING";

  const epochContext = {
    authorityEpochId: "E0",
    traceEpochId: "E0",
    governanceConstraintSetId: "GCS:ecer-smoke"
  };

  const d = classifyDivergence({ explicitNone: true });
  const res = resolveVClass(d.divergenceClass);

  const judged = evaluateBindIndexed(
    trace,
    PI_HASH_TRACE,
    epochContext,
    clock,
    manifestAug,
    matrix,
    bundle
  );

  const structuralOnly = mk1Validate(trace, { manifest: manifestAug, clock });

  const ok =
    d.divergenceClass === DIVERGENCE_CLASS.NONE &&
    res.action === RESOLUTION_ACTION.SELECT &&
    "mk1" in judged &&
    judged.mk1.valid === true &&
    judged.decisionClass === DECISION_CLASS.ACCEPT_SELF &&
    judged.piEfcCode === undefined &&
    structuralOnly.valid === true;

  console.log(
    JSON.stringify(
      {
        ok,
        classify: d,
        resolve: res,
        piEfc: {
          decisionClass: "mk1" in judged ? judged.decisionClass : null,
          piEfcCode: "mk1" in judged ? judged.piEfcCode : null
        }
      },
      null,
      2
    )
  );

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
