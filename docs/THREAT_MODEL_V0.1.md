# Rhizoh Threat Model v0.1

## Scope
This threat model covers the core runtime and the evidence layer.

## Threats
- Constitution bypass
- Causal cycle injection
- Trace tampering
- Observation spoofing
- Policy drift

## Mitigations
- Deterministic constitutional checks
- Causal DAG validation
- Trace signatures and integrity checks
- Observation signatures and provenance
- Explicit replay and counterfactual separation

## Out of Scope
- Full distributed consensus
- Autonomous multi-agent governance
- Production deployment hardening
