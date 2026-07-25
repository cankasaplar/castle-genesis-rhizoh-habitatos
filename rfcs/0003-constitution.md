# RFC 0003: Constitution as a safety boundary

## Status
Proposed

## Summary
Constitutional rules are the runtime's safety boundary. They determine whether a proposal can be committed.

## Motivation
Even semantically valid proposals can violate policy or operational constraints.

## Proposed Design
- Constitutional checks run before execution.
- Non-compliant proposals are rejected before commit.
- The runtime exports a deterministic constitutional result with each trace entry.
