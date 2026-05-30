# Applied Systems Layer (ASL) v1.0

**Thesis:** Rhizoh is no longer only a control system — it is **research + application infrastructure** connected to the real world via an **epistemic integrity engine**.

---

## Dual Rhizoh

| Layer | Role |
|-------|------|
| **Operational Rhizoh** | GCL, rollout, safety, propagation, trust, tenant isolation |
| **Research Rhizoh** | Experiments, simulation, robotics, SpiralMMO R&D — **audit only** |

**Invariant:** Research Rhizoh **never** makes production decisions; it **may analyze** Operational Rhizoh (read-only).

```js
researchMode: {
  allowedDomains: ["robotics", "simulation", "spatial_systems", "spiral_mmo", "academic_audit"],
  cannotTouch: ["GCL_LIMITS", "ROLLOUT_TIER", "BILLING", ...],
  outputType: "audit_only"
}
```

Module: `researchGovernanceLayerV0.js`

---

## System trinity

| Class | Examples |
|-------|----------|
| **Control** | GCL, rollout, lifecycle, safety contracts |
| **Intelligence** | Misread sim, propagation, trust/mythology, narrative |
| **World** | SpiralMMO compiler, robotics grounding, society economy |

---

## A) Research Governance Layer

- Institutional audit envelope (`tenantId`, `experimentId`, fingerprint)
- Hallucination tagged **`epistemic_error`** (not chat trivia)
- `assertResearchCannotTouchProductionV0(action)`

---

## B) Robotics Grounding Layer

Robotics failure mode = **wrong state / world model**, not wrong answer.

- `state.source !== sensor_verified` → `blockActuation()`
- Reuses: RAW-first, divergence, confidence detachment, tenant isolation
- Aligns with [`ROBOTICS_EPISTEMIC_FREEZE.md`](../ROBOTICS_EPISTEMIC_FREEZE.md)

Module: `roboticsGroundingSafetyLayerV0.js`

---

## C) SpiralMMO Game Kernel

SpiralMMO = **multi-agent simulation + narrative economy + spatial governance** (not “just a game”).

| Layer | Systems |
|-------|---------|
| **Simulation (internal)** | societyEconomy, causal graphs, ghost ecology, spiral evolution |
| **Game (external)** | player UX, progression, rumors, quests |

| Rhizoh | SpiralMMO |
|--------|-----------|
| propagation sim | rumor / viral event |
| trust decay | faction belief shift |
| mythology fork | lore creation |
| divergence | anomaly event |
| tenant isolation | server shard / world |

Module: `spiralMMOGameKernelV0.js`

---

## Export

`buildUnifiedStateNarrativeV0()` → `appliedSystemsLayer` bundle.

```bash
npm run ops:state-narrative
```

---

## Epistemic integrity engine (shared)

1. **Robotics** — wrong world model = physical risk  
2. **Institutional AI** — wrong narrative = wrong decision chain  
3. **SpiralMMO** — wrong lore = emergent fake reality  

Shared primitives: confidence detachment, RAW-first, divergence, tenant isolation.

---

## Next (from roadmap)

- **Public communication architecture** — developer vs public surfaces  
- **Institution governance mode** — approval chain + audit export UI  
- **Reality anchoring** — live divergence vs sim  
- **Economic autonomy** — GCL visibility ≠ epistemic authority  

---

*ASL v1.0 — applied systems on top of cultural-risk stack.*
