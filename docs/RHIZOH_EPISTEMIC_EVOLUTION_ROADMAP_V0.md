# Rhizoh Epistemic Evolution Roadmap v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Status:** living plan — phases 3–7 on prod (`rhizoh.com` legal-hold shadow lane)

---

## Phase map (user + repo alignment)

| Phase | Name | Status | Doc |
|-------|------|--------|-----|
| 3 | Passive shadow logging | ✅ | [RHIZOH_SHADOW_TRACE_LEDGER_V0.md](RHIZOH_SHADOW_TRACE_LEDGER_V0.md) |
| 3.5 | Stress-induced observation | ✅ | [RHIZOH_EPISTEMIC_STRESS_INJECTION_V0.md](RHIZOH_EPISTEMIC_STRESS_INJECTION_V0.md) |
| 4 | Persistent memory graph | ✅ | [RHIZOH_EPISTEMIC_MEMORY_GRAPH_V0.md](RHIZOH_EPISTEMIC_MEMORY_GRAPH_V0.md) |
| 5 | Council anomaly reasoning | ✅ | [RHIZOH_COUNCIL_ANOMALY_REASONING_V0.md](RHIZOH_COUNCIL_ANOMALY_REASONING_V0.md) |
| 6 | Graph lifecycle + inflation guard v2 | ✅ | [RHIZOH_EPISTEMIC_GRAPH_LIFECYCLE_V0.md](RHIZOH_EPISTEMIC_GRAPH_LIFECYCLE_V0.md) |
| **7** | **Execution Governance Switchboard (Shadow Production Mode)** | 🚧 | [RHIZOH_SHADOW_PRODUCTION_MODE_V0.md](RHIZOH_SHADOW_PRODUCTION_MODE_V0.md) |

---

## Architectural truth (post Phase 6)

Rhizoh is **not** a log-based system. It is a **causal epistemic graph engine**:

```text
events → links → measured links → council annotation
```

The graph is now **alive**. Growth is expected; unbounded growth is not.

**Phase 7 truth:** power is not the problem — **permitted layer** is. Shadow Production Mode = full internal capability + zero external effect.

---

## Critical decision: where is the growth boundary?

| Layer | Hard cap | Soft cap (Phase 6) | Policy |
|-------|----------|-------------------|--------|
| Shadow ledger ring | 512 rows | — | FIFO shift |
| Memory graph nodes | 1024 | **256 warn** | TTL + kind priority |
| Memory graph edges | 2048 | **512 warn** | edge decay weight |
| Council triggers | — | 8/min window | dynamic cooldown |
| Stress injection | — | 4/min window | 30s throttle |

**Rule:** soft cap → lifecycle pass + dampening. Hard cap → FIFO trim (existing) after TTL prune.

---

## Phase 7 deliverables

1. **Execution Governance Switchboard** — layer matrix SSOT (`rhizohExecutionGovernanceSwitchboardV0.js`)
2. **Shadow Production Mode lock** — execution OFF, simulation ON, persistence ON, external effect OFF
3. **Invited-user quarantine cohort** — observation + sandbox interaction, limited writes
4. **DevTools snapshot** — `window.__rhizoh.executionGovernance`

---

## Non-goals (Phase 7)

- Gateway multi-LLM wire (Phase 8 candidate)
- Frozen core (`phase562–570`) changes
- Opening external effects before signed READY

---

## Prod verification snippet (Phase 7)

```js
window.__rhizoh.refreshShadowDevTools?.()
console.log({
  governance: window.__rhizoh.executionGovernance,
  externalOk: window.__rhizoh.isExternalEffectPermitted?.(),
  userMutationOk: window.__rhizoh.isUserImpactingMutationPermitted?.()
})

await window.__rhizoh.injectEpistemicStress?.({ profile: 'medium', force: true })
await new Promise(r => setTimeout(r, 150))
window.__rhizoh.runGraphLifecyclePass?.()
console.log({
  lifecycle: window.__rhizoh.graphLifecycle,
  inflation: window.__rhizoh.graphInflationRisk,
  council: window.__rhizoh.councilAnomalyReasoning
})
```
