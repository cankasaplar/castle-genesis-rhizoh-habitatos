# Rhizoh Epistemic Stress Injection v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Phase:** 4 — moves shadow pipeline from trace emergence to controlled uncertainty stress.  
**Complements:** [RHIZOH_SHADOW_TRACE_LEDGER_V0.md](RHIZOH_SHADOW_TRACE_LEDGER_V0.md) · [RHIZOH_EPISTEMIC_COUNCIL_V0.md](RHIZOH_EPISTEMIC_COUNCIL_V0.md)

---

## 1. Purpose

Prod shadow mode can accumulate **real** timeouts and anchor moves (Phase 3) without proving the system survives **synthetic disagreement**. Stress injection adds deterministic uncertainty spikes for compliance replay — never execution.

| Injects | Never |
|---------|-------|
| Eval variance rows | Move selection |
| Policy_diff + topology drift | Drift feedback loops |
| Heuristic lens conflict graph | UI / product effect |
| Council dry-run after stress | Gateway LLM wire (v0) |

---

## 2. Profiles

| Profile | Eval variance | Timeout | Lenses | Adversarial stream |
|---------|---------------|---------|--------|--------------------|
| `light` | 0.38 | no | 2 | no |
| `medium` | 0.58 | yes | 3 | no |
| `adversarial` | 0.88 | yes (UGE-scale) | 4 | yes |

---

## 3. DevTools

```js
await window.__rhizoh.injectEpistemicStress?.({ profile: 'medium' })
window.__rhizoh.exportShadowComplianceSnapshot?.('post_stress')
// → stressInjection: { stressRunId, conflictGraph, councilTriggered }
```

Legacy entropy test remains: `injectShadowEntropyTest()`.

---

## 4. Compliance export fields

`exportShadowComplianceSnapshot` adds:

```text
stressInjection: {
  stressRunId,
  profile,
  recordCount,
  conflictGraph,   // heuristic multi-lens disagreement
  councilTriggered
}
```

---

## 5. Code

| Module | Role |
|--------|------|
| `rhizohEpistemicStressInjectionV0.js` | Profiles, conflict graph, council force-trigger |
| `rhizohShadowTraceLedgerV0.js` | Ledger rows + compliance `stressInjection` |
| `rhizohEpistemicCouncilV0.js` | Dry-run session after stress (unchanged governance) |

---

## 6. Governance (unchanged)

Stress output uses the same isolation as shadow ledger rows:

```text
feedsDriftDetection: false
feedsMoveSelection: false
executionEffect: false
uiEffect: false
```
