/**
 * Poisoned-trace stress suite baseline — ANF + π + clock witness + πEFC labels.
 * @see docs/MK1_KERNEL_VALIDATOR_V0_1.md §10
 */
import { anfExpectedOpId } from "../anfReduce.mjs";
import { projectPi } from "../projectPi.mjs";
import { H_canon } from "../mk1Validate.mjs";

export const manifest = { manifestVersion: "1.0.0" };
export const clock = { clockId: "c1", gdkPolicyVersion: "GDK-1", tick: 2 };

/** 64-char lowercase hex — trace-bound projection fingerprint (policy, not identity oracle). */
export const PI_HASH_TRACE =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

/** Stable multiset identity — permutation-invariant ANF (iota) vs array index. */
const e0 = { kind: "causal", anfBinding: 0 };
const e1 = { kind: "causal", anfBinding: 1 };
const op0 = anfExpectedOpId(e0, 0, manifest, clock);
const op1 = anfExpectedOpId(e1, 1, manifest, clock);

const body = projectPi({
  nodes: [],
  edges: [
    { kind: "causal", anfBinding: 0, opId: op0 },
    { kind: "causal", anfBinding: 1, opId: op1 }
  ],
  manifestVersion: manifest.manifestVersion,
  mk1ClockWitness: { tick: 2 },
  projectionEpochId: "E0",
  piHash: PI_HASH_TRACE
});

export const trace = {
  ...body,
  finalHash: H_canon(body)
};
