# Rhizoh Core Specification v0.1

## 1. Purpose
This document defines the normative contract for the Rhizoh Reference Core. It is not a user guide; it is a technical specification for the execution architecture.

## 2. Normative language
The key words MUST, SHOULD, and MAY are used as described in RFC 2119.

## 3. Core lifecycle
The runtime MUST implement the following lifecycle:

1. Observation
2. Inference
3. Proposal
4. Commit

## 4. Formal guarantees
The core MUST provide the following guarantees:

- Replay Determinism: for equivalent observations and policies, replay MUST yield the same trace.
- Trace Immutability: a trace entry MUST be immutable after constitutional commit.
- Constitution Safety: a proposal MUST NOT be committed if it violates the constitutional boundary.
- Causal Safety: self-parenting and impossible causal structures MUST be rejected.

## 5. Observation contract
An Observation MUST include:

- id
- timestamp
- confidence
- signature
- modality
- sensor_type
- provenance

## 6. Evidence contract
Every execution record MUST contain:

- proposal id
- confidence
- belief state before and after
- constitutional outcome
- causal parent
- provenance
- trace signature

## 7. Replay and counterfactual separation
Replay MUST be used for historical truth. Counterfactual MUST be used for alternative futures. They MUST remain semantically distinct.

## 8. Architectural framing
The runtime is the Rhizoh Reference Core. It MUST be separated from habitat-specific, product-specific, and application-specific layers.
