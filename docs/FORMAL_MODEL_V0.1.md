# Rhizoh Formal Model v0.1

## 1. Core Definitions

### Definition 1. Execution Determinism
For every observation sequence $O$ and policy set $P$, replaying the same sequence must produce the same trace:

$$
\forall O, P \; . \; Replay(O, P) = T \land Replay(O, P) = T
$$

### Definition 2. Trace Immutability
A trace becomes immutable after constitutional commit:

$$
Trace_{commit} \rightarrow Immutable
$$

and for any appended record $a$:

$$
hash(trace \oplus a) \neq hash(trace)
$$

### Definition 3. Constitution Safety
A proposal may be committed only if it belongs to the allowed action set:

$$
proposal \notin AllowedActions \Rightarrow commit = impossible
$$

### Definition 4. Observation Identity
An observation is a signed record with identity and provenance:

$$
Observation = \langle id, source, timestamp, confidence, signature, modality, sensor\_type, provenance \rangle
$$

## 2. Lifecycle

$$
Observation \rightarrow Inference \rightarrow Proposal \rightarrow Commit
$$

## 3. Distinction: Replay vs Counterfactual

- Replay models historical truth.
- Counterfactual models alternative future trajectories.

These are distinct semantic modes and should not be conflated.
