#!/usr/bin/env node
import { CAUSAL_DOMAIN_V0 } from "./driftCausalityLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dcl-gate-ci" });
const dcl = n.driftCausality;
const rdol = n.realityDriftObserver;

if (!dcl?.schema) {
  console.error("DCL_GATE_FAIL: missing driftCausality");
  process.exit(1);
}

const domains = dcl.causalDomains;
const allDomainsPresent =
  domains?.propagation?.domain === CAUSAL_DOMAIN_V0.PROPAGATION &&
  domains?.edpl?.domain === CAUSAL_DOMAIN_V0.EDPL_PACING &&
  domains?.dpub?.domain === CAUSAL_DOMAIN_V0.DPUB_UNCERTAINTY &&
  domains?.cabEcl?.domain === CAUSAL_DOMAIN_V0.CAB_ECL_AUTHORITY;

const rdolOk = Boolean(rdol?.schema);
const linkageOk = dcl.rdolLinkage?.driftShapesObserved === (rdol?.misapprehensionShapeCatalog?.shapeCount ?? 0);
const shapeLinksOk = Array.isArray(dcl.shapeCausality?.links);
const noExecute = dcl.nonExecutable === true && n.interpretationSafetyContract?.can_execute === false;

const payload = {
  gate: "rhizoh.drift_causality_gate.v0",
  ranAt: new Date().toISOString(),
  driftShapesObserved: dcl.rdolLinkage?.driftShapesObserved,
  shapesWithCausalExplanation: dcl.rdolLinkage?.shapesWithCausalExplanation,
  activeDomainCount: dcl.causalitySummary?.activeDomainCount,
  allDomainsPresent,
  rdolOk,
  passed: allDomainsPresent && rdolOk && linkageOk && shapeLinksOk && noExecute
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
