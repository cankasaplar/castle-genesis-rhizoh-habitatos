# Rhizoh Shadow Production Mode v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Status:** active on `rhizoh.com` legal-hold lane  
**Module:** `apps/client/src/rhizoh/runtime/rhizohExecutionGovernanceSwitchboardV0.js`

---

## 1. Problem statement

System power is not the risk. The risk is **which layer power is permitted on**.

During legal preamble / legal hold the stack must run at full internal capability while **zero external or user-impacting execution** leaks. Sandbox here is not a downgrade — it is an **isolated execution layer** that simulates real-world effect without producing it.

```text
execution        = OFF
simulation       = ON
persistence      = ON
external effect  = OFF
```

---

## 2. Shadow Production Mode matrix

| Layer | State |
|-------|-------|
| UI rendering | ON |
| Agents | ON |
| Council | ON |
| Memory graph | ON |
| Stress engine | ON |
| Simulation | ON |
| Persistence | ON |
| External effects | OFF |
| Legal gate | HARD BLOCK |
| User-impacting mutations | OFF |

This is the **Execution Governance Switchboard** — the missing top-layer lock that prevents shadow production leak as the graph grows.

---

## 3. Invited users = quarantine cohort

Admitted closed-admission subjects during legal hold are **quarantine cohort**:

| Capability | State |
|------------|-------|
| Full system observation | ON |
| Sandbox interaction | ON |
| Feedback events | ON |
| Write permission | LIMITED |
| External / world action | OFF |

Opaque subject refs only — no named invite list. See [RHIZOH_CLOSED_USER_ADMISSION_V0.1.md](RHIZOH_CLOSED_USER_ADMISSION_V0.1.md).

---

## 4. DevTools verification

```js
window.__rhizoh.executionGovernance
window.__rhizoh.getExecutionGovernanceSnapshot?.()
window.__rhizoh.isExternalEffectPermitted?.()
window.__rhizoh.isUserImpactingMutationPermitted?.()
```

Expected during legal hold:

```js
{
  mode: "legal_hold",
  shadowProductionMode: true,
  legalGateHardBlock: true,
  externalEffectPermitted: false,
  userImpactingMutationPermitted: false,
  layers: {
    council: "on",
    memory_graph: "on",
    external_effects: "off",
    legal_gate: "hard_block"
  }
}
```

Combined epistemic pass:

```js
await window.__rhizoh.injectEpistemicStress?.({ profile: 'medium', force: true })
await new Promise(r => setTimeout(r, 150))
window.__rhizoh.refreshShadowDevTools?.()
console.log({
  governance: window.__rhizoh.executionGovernance,
  council: window.__rhizoh.councilAnomalyReasoning,
  inflation: window.__rhizoh.graphInflationRisk
})
```

---

## 5. Work packages (parallel tracks)

| Track | Focus |
|-------|-------|
| **A — Stabilization** | drawer bug fix, UI cleanup, runtime errors, voice adapter fallback |
| **B — Epistemic hardening** | graph inflation control, council consistency, stress determinism |
| **C — Production readiness** | invited-user whitelist, sandbox gating, replay guarantee, deployment freeze |

Phase 7 (switchboard) unblocks controlled progress on A/B/C without opening execution authority.

---

## 6. Non-goals

- Frozen core (`phase562–570`) changes
- Gateway multi-LLM wire (Phase 8 candidate)
- Auto-enabling external effects before signed READY

---

## 7. Related docs

- [RHIZOH_SHADOW_PROD_3DAY_SPRINT_V0.md](RHIZOH_SHADOW_PROD_3DAY_SPRINT_V0.md)
- [RHIZOH_CHESS_BROADCAST_8CAM_RUNBOOK_V0.md](RHIZOH_CHESS_BROADCAST_8CAM_RUNBOOK_V0.md)
- [RHIZOH_EPISTEMIC_EVOLUTION_ROADMAP_V0.md](RHIZOH_EPISTEMIC_EVOLUTION_ROADMAP_V0.md)
- [RHIZOH_SHADOW_TRACE_LEDGER_V0.md](RHIZOH_SHADOW_TRACE_LEDGER_V0.md)
- [RHIZOH_CLOSED_USER_ADMISSION_V0.1.md](RHIZOH_CLOSED_USER_ADMISSION_V0.1.md)
