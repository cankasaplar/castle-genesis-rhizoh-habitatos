/**
 * MK-1 CLI fixture — exports trace, manifest, clock.
 * ANF opIds + π(body) canonical ([`anfReduce.mjs`](../anfReduce.mjs), [`projectPi.mjs`](../projectPi.mjs)).
 * @see docs/MK1_KERNEL_VALIDATOR_V0_1.md
 */
import { anfExpectedOpId } from "../anfReduce.mjs";
import { projectPi } from "../projectPi.mjs";
import { H_canon } from "../mk1Validate.mjs";

export const manifest = { manifestVersion: "1.0.0" };
export const clock = { clockId: "c1", gdkPolicyVersion: "GDK-1" };

const edge = { kind: "causal" };
const opId = anfExpectedOpId(edge, 0, manifest, clock);

const body = projectPi({
  nodes: [],
  edges: [{ kind: "causal", opId }],
  manifestVersion: manifest.manifestVersion
});

export const trace = {
  ...body,
  finalHash: H_canon(body)
};
