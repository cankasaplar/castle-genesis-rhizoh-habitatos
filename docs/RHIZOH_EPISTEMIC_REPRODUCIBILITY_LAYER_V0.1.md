# Rhizoh epistemic reproducibility layer v0.1

**SPECFLOW:** `RESEARCH-ONLY` (external audit / cross-env verification; no enforcement)

Answers: **does the same §6 audit bundle canonicalize identically across environments?** · **does gateway latency class change boundary when seq snapshot is identical?** · **is boundary evaluation deterministic?**

## Module

`apps/client/src/rhizoh/runtime/epistemicReproducibilityLayerV0.js`

| API | Role |
|-----|------|
| `canonicalizeAuditBundleForReproV0` | Strip volatile fields (correlationId, timestamps, session) |
| `fingerprintReproducibleBundleV0` | Stable `repro_bundle_*` hash |
| `compareReproducibleBundlesV0` / `compareImportedBundleEnvironmentsV0` | Staging vs local JSON diff |
| `probeBoundaryConsistencyReproducibilityV0` | N runs, same inputs → one `boundary_state` |
| `probeGatewayLatencyDriftV0` | `ok_fast` vs `ok_slow` vs `timeout` |
| `runCrossEnvironmentBundleProbeV0` | Multiple profiles → fingerprint match |
| `runExternalReproducibilityReportV0` | Unified report |

## Gateway latency (v0.1 finding)

| External class | Same seq snapshot | Typical boundary |
|----------------|-------------------|------------------|
| `ok_fast` / `ok_slow` | Yes | **Identical** (`ALIGNED` or `DIVERGED` by delta only) |
| `timeout` (unreachable) | No live gateway | **SKIPPED** (or **DIVERGED** if `requireGateway`) |

Latency **metadata** (`fetchPhase`) does not change boundary when `gatewayLive` and `lastAcceptedSeq` are equal.

## Cross-environment probe

Default profiles: `local_no_gateway_a` + `local_no_gateway_b` with fixed `collectSignals`. Expect `allFingerprintsMatch: true` when law + playbook inputs are identical.

Live gateway profiles may diverge on `boundary.external` — compare canonical `boundary.checks` only, or run with `fetchExternal: false` for law replay.

## Captain

```javascript
const report = await window.__rhizoh.epistemicReproducibility.runReport();
window.__rhizoh.epistemicReproducibility.export(report);

// Staging vs local paste
window.__rhizoh.epistemicReproducibility.compareImported(stagingJson, localJson);
```

## Related

- [`RHIZOH_EPISTEMIC_AUDIT_BUNDLE_V0.1.md`](RHIZOH_EPISTEMIC_AUDIT_BUNDLE_V0.1.md)
- [`RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md`](RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md)
