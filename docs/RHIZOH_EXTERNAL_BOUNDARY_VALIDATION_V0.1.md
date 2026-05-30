# Rhizoh External Boundary Validation (v0.1)

**Status:** SECURED — A11 closure path (client truth vs gateway truth)  
**Tag:** `CORE-ELIGIBLE` · READ-ONLY validation + factual breach log — **no enforcement**

**Closes:** Attack model **A11** (partial) — *per-client truth ≠ network truth* becomes **measurable**, not only hypothesized.

---

## Position in stack

```text
Internal: coherence ✔ causality ✔ interpretation ✔
External: client snapshot ↔ gateway snapshot → ALIGNED | DIVERGED | SKIPPED
```

| Layer | Question |
|-------|----------|
| Observability | What happened (internal)? |
| Synthesis | What does it mean together? |
| **External boundary** | Does client view match gateway authority surface? |

Still **no** centralized arbitration bus — validation **records** divergence; playbook modes still handle response elsewhere.

---

## Signals compared

| Client (`collectClientBoundarySnapshotV0`) | Gateway (`fetchExternalBoundarySnapshotV0`) |
|-------------------------------------------|-----------------------------------------------|
| `clientSeqHead` (epistemic bus trace max) | `genesisStream.lastAcceptedSeq` from `GET /rhizoh/genesis/runtime` |
| `eventSeqTail` | — |
| `shadowWalTick` | — |
| — | `GET /health/live` reachability |

**Divergence rule:** `clientSeqHead - lastAcceptedSeq > MAX_CLIENT_SEQ_AHEAD_OF_GATEWAY` (default **8**) → `DIVERGED`.

**Skip (honest):** No gateway origin · health fail (unless `requireGateway`) · missing seq on either side.

---

## Module

`apps/client/src/rhizoh/runtime/externalBoundaryValidationV0.js`

| API | Role |
|-----|------|
| `collectClientBoundarySnapshotV0()` | Client-side truth sample |
| `fetchExternalBoundarySnapshotV0()` | Gateway health + runtime cursor |
| `evaluateExternalBoundaryValidationV0(client, external)` | Compare → `boundary_state` |
| `runExternalBoundaryValidationV0({ observe })` | Full async pass + optional breach log |
| `observeExternalBoundaryBreachV0(result)` | Append `breach_observation_v0` on DIVERGED |

**Captain:**

```javascript
await window.__rhizoh.externalBoundary.validate({ observe: true });
window.__rhizoh_external_boundary;
```

**Vitest:**

```bash
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/externalBoundaryValidationV0.test.js
```

**Law stress:** scenario `external_boundary_divergence` in violation simulation suite.

---

## `boundary_state`

| State | Meaning |
|-------|---------|
| `ALIGNED` | Client seq within tolerance of gateway |
| `DIVERGED` | Client ahead of gateway beyond tolerance (A11) |
| `SKIPPED` | Cannot compare (no origin, no seq, gateway optional off) |

---

## Go-Live / audit hook

Before §6 shift (recommended):

```javascript
const boundary = await window.__rhizoh.externalBoundary.validate({ observe: true });
const integrity = window.__rhizoh.goLiveIntegrity.evaluate(
  window.__rhizoh.goLiveIntegrity.collect()
);
const coherence = window.__rhizoh.breachSynthesis.coherence({ windowMs: 120_000 });
// Log boundary + integrity + coherence to SESSION_LOG
```

---

## Honest limits (v0.1)

| Limit | v0.2 |
|-------|------|
| Single seq scalar compare | Multi-field gateway cursor + WAL peer echo |
| Manual captain invoke | Hook into §7 loop tick |
| No automatic Level A | Recommend on sustained DIVERGED |
| CORS / staging origin | Document origin alignment in captain runbook |

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md`](RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md) | A11 hypothesis |
| [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md) | Factual log |
| [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) | §7 gateway seq |

---

*Internal law can be perfect and still disagree with the network. This layer makes that disagreement visible.*
