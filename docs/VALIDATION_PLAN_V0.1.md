# Validation Plan v0.1

## Objective
Validate that the same Rhizoh Reference Core can operate across distinct domains without changing the core execution path.

## Domains
- Medical triage
- Financial approval
- Robotics
- Drone mission
- Industrial control

## Validation approach
For each domain, the runtime executes the same lifecycle:

1. Observation
2. Ontology interpretation
3. Proposal generation
4. Constitutional gating
5. Trace emission

## Success criteria
- The same core runtime accepts the domain-specific observation format.
- The same constitutional and causal gates are applied.
- Each domain produces a verifiable execution trace.
