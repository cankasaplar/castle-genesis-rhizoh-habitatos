import test from "node:test";
import assert from "node:assert/strict";
import {
  noteGenesisIngressClientActivityV0,
  resetGenesisIngressSocialBalancerForTestsV0,
  resolveAgentSpokeRateLimitV0
} from "../genesisIngressSocialBalancerV0.js";

test("agent spoke limit tightens as concurrent clients rise", () => {
  resetGenesisIngressSocialBalancerForTestsV0();
  assert.equal(resolveAgentSpokeRateLimitV0(), 8);
  for (let i = 0; i < 4; i += 1) noteGenesisIngressClientActivityV0(`user:${i}`);
  assert.equal(resolveAgentSpokeRateLimitV0(), 6);
  for (let i = 4; i < 12; i += 1) noteGenesisIngressClientActivityV0(`user:${i}`);
  assert.equal(resolveAgentSpokeRateLimitV0(), 2);
});
