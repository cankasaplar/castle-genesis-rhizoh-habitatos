# RFC 0004: Planner as a separate phase

## Status
Proposed

## Summary
Planning and execution should be modeled as distinct phases, not as a single undifferentiated event stream.

## Motivation
A clear separation between inference, proposal generation, and commit improves auditability and future extensibility.

## Proposed Design
- Observation -> Inference -> Proposal -> Commit is modeled explicitly.
- Counterfactual replay can re-run the same observation through alternative planners or policies.
- The runtime remains deterministic when the same input and policy are provided.
