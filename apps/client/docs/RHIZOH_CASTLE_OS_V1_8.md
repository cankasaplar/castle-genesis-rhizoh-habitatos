# Castle OS v1.8 — Stability Physics Lifecycle

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.7](RHIZOH_CASTLE_OS_V1_7.md)

---

## Architectural break

| Version | Negotiation model |
|---------|-------------------|
| v1.6 | Live negotiation |
| v1.7 | Learned negotiation physiology (session continuation) |
| v1.8 | **Lifecycle physics** — decay, traceability, persistence, implicit learning |

Identity: **Personal Reality Co-Processor** with **Adaptive Cognitive Physics + Learned Temporal Human Modeling**

> Stability learning is always **traceable** — human + system co-runtime requires observable learning.

---

## Stack

```
v1.7 Memory Loop
        ↓
Implicit Bias Learning (no explicit command)
        ↓
Physics Decay + Re-normalization (overfit guard)
        ↓
Learning Trace Ledger (every adaptation logged)
        ↓
Lifecycle Persistence + Cross-device envelope
        ↓
Execution
```

---

## v1.8 pillars

### 1. Stability decay + re-normalization

Prevents **overfitting user behavior**:
- After idle period → profile decays toward defaults
- If deviation exceeds bound → re-normalize pull toward baseline

### 2. Implicit bias learning

Adaptation without stability commands:
- Rapid mic interrupts → interruption tolerance learning
- High salience voice → speech priority nudge
- Ambient engagement → modality bias EMA

### 3. Lifecycle persistence + cross-device sync

```javascript
window.__rhizoh.exportPhysicsLifecycle("user_local")
window.__rhizoh.importPhysicsLifecycle("user_local", envelope, { merge: true })
```

localStorage persistence on observation; merge import for multi-device continuity.

### 4. Learning trace (mandatory)

```javascript
window.__rhizoh.getStabilityLearningTrace("user_local")
window.__rhizoh.lastOsLoop.learningTrace
```

Kinds: `memory_observe`, `implicit_bias`, `decay`, `renormalize`, `persist`, `sync_export`, `sync_import`, `prior_applied`

Every entry: `traceId`, `reason`, `deltas`, `humanVisible: true`, `attributableTo: system_learning_v1_8`

---

## Product truth

v1.7: negotiation partially solved **before** interaction  
v1.8: that physiology is **lifecycle-managed** — persists, decays, re-normalizes, and remains **auditable**

Not reactive assistant · not merely adaptive · **predictive cognitive co-processor** with traceable learning.

---

## API

```javascript
window.__rhizoh.getStabilityLearningTrace("user_local")
window.__rhizoh.exportPhysicsLifecycle("user_local")
window.__rhizoh.importPhysicsLifecycle("user_local", envelope)
window.__rhizoh.lastOsLoop.stabilityLifecycle
window.__rhizoh.lastOsLoop.learningTrace
```
