# Rhizoh Epistemic Identity Specification v0

**Status:** DRAFT · `RESEARCH-ONLY`  
**Schema family:** `castle.rhizoh.epistemic_identity.*`  
**Spine:** Observation ≠ Execution

**Related runtime:** `epistemicIdentityContinuityV0.js` · `identityManifestProjectionV0.js` · `epistemicAuditBundleV0.js`

---

## 1. Scope and non-claims

This specification defines **observability handles** and **continuity verdicts** derived from the epistemic audit stack. It does **not** define:

- Legal personhood, user accounts as ontological subjects, or KYC identity
- Guaranteed persistence of a single `epi_id_*` across all environments without reproducibility preconditions
- Execution authority derived from identity projection

| Term | Meaning |
|------|---------|
| **Epistemic identity** | Derived subject handle + digest chain from audit/repro stack |
| **Identity projection** | Read-only manifest (`identityManifest.project()`) |
| **Identity evolution** | Future Phase 2 — user interaction → identity event log (not active in Phase 1) |

---

## 2. Identity generation

### 2.1 Handle format

```
epistemicIdentityId = "epi_id_" + rootDigest.hex[0:12]
```

- `rootDigest` = hash chain over bundle reproducibility fingerprints
- Prefix is fixed; suffix is **deterministic given audit inputs**, not a random session id

### 2.2 Bootstrap reference (documented capture)

First production audit capture (SESSION_LOG 2026-06-19):

| Field | Example value |
|-------|----------------|
| `epistemicIdentityId` | `epi_id_b1db96a3` |
| `rootDigest` | `hb1db96a3` |
| `ledgerIdentityHash` | `h135247c0` |
| `tickGraphDigest` | `h3ea3ee83` |
| `fingerprintChainLength` | `1` |
| `reproConsistent` | `true` |

Live sessions may produce different handles (e.g. `epi_id_0447ac46`) as the audit graph evolves. Public JSON publishes **bootstrap reference only**; runtime truth is always `identityManifest.project()`.

### 2.3 Generation inputs (binds)

| Spine | API |
|-------|-----|
| Ledger identity hash | `deriveLedgerIdentityHashV0()` |
| Tick graph drift | `deriveTickGraphIdentityDriftV0()` |
| Bundle fingerprint evolution | `recordBundleFingerprintEvolutionV0()` |
| Repro consistency window | `assessReproducibilityConsistencyOverTimeV0()` |

### 2.4 Console verification

```javascript
await window.__rhizoh.epistemicAuditBundle.run();
const id = window.__rhizoh.epistemicIdentity.global();
const report = window.__rhizoh.epistemicIdentity.evaluate();
const manifest = window.__rhizoh.identityManifest.project();
```

---

## 3. Continuity verification

### 3.1 Verdict enum

| Verdict | Meaning |
|---------|---------|
| `uninitialized` | No bundle fingerprint recorded yet |
| `same_subject` | Stable repro fingerprint window + no fork signals |
| `subject_drift` | Graph or epistemic state evolution under stable law |
| `subject_fork` | Law layer flip or discontinuous fingerprint jump |

### 3.2 Manifest continuity (Phase 1)

Identity manifest always reports:

```
continuityVerdict: "read_only_projection"
```

This is **not** the epistemic continuity verdict — it marks the manifest layer as non-authoritative projection.

### 3.3 Research question (paper hook)

> How can a persistent AI system demonstrate that it remains the **same subject** across sessions?

Rhizoh's Phase 1 answer: **reproducible audit bundle fingerprints + ledger/tick digests**, interpreted under explicit verdict rules — not narrative self-description by an LLM.

---

## 4. Drift detection

Drift is evaluated when:

1. Audit bundle runs and records fingerprint evolution
2. Tick graph identity hash changes beyond threshold
3. Reproducibility layer reports cross-environment mismatch

| Signal | Interpretation |
|--------|----------------|
| Stable `ledgerIdentityHash` + stable repro window | `same_subject` candidate |
| Monotonic graph growth without law flip | `subject_drift` candidate |
| Discontinuous fingerprint jump | `subject_fork` candidate |

All verdicts: `interpretationOnly: true` · `influencesExecution: false`.

---

## 5. Compression governance

Causal graph exposure follows a **compression policy**:

| Layer | Published | Notes |
|-------|-----------|-------|
| Public causal snapshot | Aggregate counts only | `.well-known/rhizoh-causal-snapshot.json` |
| Identity manifest projection | Summarized node kinds | No raw PII |
| Full `causalMapRaw` | Not public | Internal / invited observation only |

Compression fields in manifest `causalSummary`:

- `nodeCount` / `edgeCount` (projected)
- `rawNodeCount` / `rawEdgeCount` (when available)
- `compressed: boolean`
- `truth_loss` — structural pass required for integrity tiers

**Rule:** Compression may reduce presentation size; it must not silently claim `truth_loss: 0` when structural integrity checks fail.

---

## 6. Phase boundary — Identity Projection vs Identity Evolution

Phase 1 manifest output may include:

```json
{
  "identityPipeline": {
    "eventPipelineWired": false,
    "lifecycleTurnCount": 0,
    "eventLogCount": 0,
    "pipelineNote": "world/chess not routed to identity event SSOT"
  }
}
```

| Path | Phase 1 status |
|------|----------------|
| world → causal graph → epistemic identity | **Active** (read/derive) |
| user interaction → identity event log → continuity | **Deferred** (Phase 2) |

This is academically **clean**: publish **Identity Projection** now; **Identity Evolution** is a future controlled activation, not a hidden gap.

**Forbidden in Phase 1:** `appendIdentityEventV0` from world/chess paths.

---

## 7. Public surfaces

| Artifact | URL |
|----------|-----|
| Identity JSON | https://rhizoh.com/.well-known/rhizoh-identity.json |
| Causal snapshot | https://rhizoh.com/.well-known/rhizoh-causal-snapshot.json |
| Identity manifest spec (this doc) | https://rhizoh.com/rhizoh/epistemic-identity-spec.md |
| Identity projection spec | https://rhizoh.com/rhizoh/identity-manifest-v0.md |

---

## 8. Related documents

- https://rhizoh.com/rhizoh/identity-manifest-v0.md
- https://rhizoh.com/rhizoh/protocol-v0.md
- https://rhizoh.com/rhizoh/honest-baseline-charter-v1.md
- https://rhizoh.com/.well-known/rhizoh-identity.json

---

*Observation ≠ Execution — epistemic identity is derived, not decreed.*
