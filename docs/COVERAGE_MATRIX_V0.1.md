# Coverage Matrix v0.1

| Claim | Spec | Test | Status |
|---|---|---|---|
| Replay Determinism | Formal Model §1 | test_replay_invariants_are_deterministic | Verified |
| Trace Immutability | Formal Model §2 | test_trace_integrity_verification_detects_tampering | Verified |
| Constitution Safety | Specification §4 | test_provenance_and_conflict_resolution | Verified |
| Observation Pipeline | Specification §5 | test_observation_signature_and_formal_guarantees | Partial |
| Counterfactual Isolation | Specification §7 | test_counterfactual_replay_returns_alternative_trace | Partial |
