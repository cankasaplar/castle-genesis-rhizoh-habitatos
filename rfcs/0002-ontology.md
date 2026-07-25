# RFC 0002: Ontology before planning

## Status
Proposed

## Summary
Ontology constraints must be evaluated before planning or execution can proceed.

## Motivation
Planning cannot safely bypass semantic impossibility.

## Proposed Design
- Ontology rules are hard constraints.
- Violations cause immediate rejection.
- Ontology is the gate that narrows the space of valid proposals.
