# Rhizoh Epistemic Evolution Roadmap v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Status:** living plan — phases 3–6 on prod (`rhizoh.com` legal-hold shadow lane)

---

## Phase map (user + repo alignment)

| Phase | Name | Status | Doc |
|-------|------|--------|-----|
| 3 | Passive shadow logging | ✅ | [RHIZOH_SHADOW_TRACE_LEDGER_V0.md](RHIZOH_SHADOW_TRACE_LEDGER_V0.md) |
| 3.5 | Stress-induced observation | ✅ | [RHIZOH_EPISTEMIC_STRESS_INJECTION_V0.md](RHIZOH_EPISTEMIC_STRESS_INJECTION_V0.md) |
| 4 | Persistent memory graph | ✅ | [RHIZOH_EPISTEMIC_MEMORY_GRAPH_V0.md](RHIZOH_EPISTEMIC_MEMORY_GRAPH_V0.md) |
| 5 | Council anomaly reasoning | ✅ | [RHIZOH_COUNCIL_ANOMALY_REASONING_V0.md](RHIZOH_COUNCIL_ANOMALY_REASONING_V0.md) |
| **6** | **Graph lifecycle + inflation guard v2** | 🚧 | [RHIZOH_EPISTEMIC_GRAPH_LIFECYCLE_V0.md](RHIZOH_EPISTEMIC_GRAPH_LIFECYCLE_V0.md) |

---

## Architectural truth (post Phase 5)

Rhizoh is **not** a log-based system. It is a **causal epistemic graph engine**:

```text
events → links → measured links → council annotation
```

The graph is now **alive**. Growth is expected; unbounded growth is not.

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

## Phase 6 deliverables

1. **Inflation guard v2** — soft cap, advisory actions, compliance export
2. **Edge decay policy** — aged edges lose weight; prune below floor
3. **Node TTL strategy** — per-kind TTL (lens < projection < hub)
4. **Anomaly dampening** — compress reported score when inflation elevated
5. **Council load balancing** — dynamic cooldown from inflation level

---

## Non-goals (Phase 6)

- Gateway multi-LLM wire (Phase 7 candidate)
- Frozen core (`phase562–570`) changes
- Execution / move / drift feedback paths

---

## Prod verification snippet (Phase 6)

```js
await window.__rhizoh.injectEpistemicStress?.({ profile: 'medium', force: true })
await new Promise(r => setTimeout(r, 150))
window.__rhizoh.runGraphLifecyclePass?.()
console.log({
  lifecycle: window.__rhizoh.graphLifecycle,
  inflation: window.__rhizoh.graphInflationRisk,
  councilCooldown: window.__rhizoh.epistemicCouncil?.cooldownMs
})
```
