# Rhizoh epistemic identity continuity v0.1

**SPECFLOW:** `RESEARCH-ONLY` → runtime interpretation layer (not frozen core; no execution authority)

Answers: **bundle reproducible across environments, but what is the long-run system subject identity?**

Distinct from lab module `continuity/__research__/epistemicIdentityContinuityV0.js` (Phase 9 spec). This v0 binds the **operational epistemic stack**.

## Binds

| Spine | API |
|-------|-----|
| Ledger identity hash | `deriveLedgerIdentityHashV0()` |
| Tick graph identity drift | `deriveTickGraphIdentityDriftV0()` |
| Audit bundle fingerprint evolution | `recordBundleFingerprintEvolutionV0()` |
| Repro consistency over time | `assessReproducibilityConsistencyOverTimeV0()` |
| Global subject | `getGlobalEpistemicIdentityV0()` · `evaluateEpistemicIdentityContinuityV0()` |

## Verdicts

| Verdict | Meaning |
|---------|---------|
| `uninitialized` | No bundle fingerprint recorded yet |
| `same_subject` | Stable repro fingerprint window + no fork signals |
| `subject_drift` | Graph or epistemic state evolution under stable law |
| `subject_fork` | Law layer flip or discontinuous fingerprint jump |

## Identity root

`rootDigest` = hash chain over bundle reproducibility fingerprints.  
`epistemicIdentityId` = `epi_id_<12 hex chars>` — observability handle, **not** ontological truth.

**Observation ≠ Execution** — verdicts are interpretation only.

## Wiring

- Ledger append → `touchEpistemicIdentityFromLedgerV0` (async)
- Audit bundle → `evaluateEpistemicIdentityContinuityV0({ bundle })` (default `recordIdentity: true`)

## Captain

```javascript
await window.__rhizoh.epistemicAuditBundle.run();
const id = window.__rhizoh.epistemicIdentity.global();
const report = window.__rhizoh.epistemicIdentity.evaluate();
```

## Related

- Causal why-layer: [`RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md`](RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md)
- [`RHIZOH_EPISTEMIC_AUDIT_BUNDLE_V0.1.md`](RHIZOH_EPISTEMIC_AUDIT_BUNDLE_V0.1.md)
- [`RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md`](RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md)
- [`apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md`](../apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md) (research lineage)
