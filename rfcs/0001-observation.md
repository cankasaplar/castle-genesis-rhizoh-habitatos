# RFC 0001: Observation as a first-class runtime input

## Status
Proposed

## Summary
Observations should be treated as first-class runtime artifacts. They carry identity, provenance, confidence, noise model, and signature information.

## Motivation
The runtime needs a verifiable boundary between raw sensory information and internal proposals.

## Proposed Design
- Observation objects carry id, source, timestamp, confidence, signature, noise model, and provenance.
- Ontology and planning consume observations rather than treating them as opaque strings.
- Each observation is signed and can be replayed deterministically.
