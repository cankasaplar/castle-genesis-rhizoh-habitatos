# Threat Coverage Matrix v0.1

| Threat | Covered by | Status |
|---|---|---|
| Trace tampering | verify_trace_integrity | Covered |
| Policy bypass | constitution evaluation | Covered |
| Replay drift | deterministic replay tests | Covered |
| Fake observation | observation signature + provenance | Covered |
| Timestamp manipulation | observation signature | Partial |
| Causal cycle injection | causal parent validation | Covered |
