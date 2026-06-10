# Castle OS v1.6 — Stability Co-Governance (Human-in-the-Loop)

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.5](RHIZOH_CASTLE_OS_V1_5.md)

---

## Architectural break

| Version | Stability decided by |
|---------|---------------------|
| v1.5 | System only |
| v1.6 | **User + system negotiated field** |

> Stability is no longer a threshold — it is an **interaction contract** per session.

Identity: **Adaptive Cognitive Environment with User-Coherent Stability**

Rhizoh is not designing AI or assistant — it is designing a **shared cognition space**.

---

## Stack

```
Fusion → Attention → Spike → Kernel
          ↓
   v1.5 Stability Governor (system inference)
          ↓
   Stability Co-Governor ← USER INPUT
          ↓
   Phase Engine (soft-locked, blended)
          ↓
   Execution Layer
```

Core formula:

```
phase = blend(system.compute(), user.signal(), finalStabilityWeight)
```

---

## CoGovernorState

```javascript
{
  userStabilityBias,      // chaotic (0) ↔ focused (1)
  systemStabilityBias,    // from phase stabilityScore
  negotiationField: { delta, magnitude, direction, userInfluence },
  finalStabilityWeight    // blended decision weight
}
```

`direction`: `aligned` | `user_leans_fast` | `user_leans_stable`

---

## StabilityAgreement (per session)

```javascript
{
  userIntentProfile: { focusBias, speechPriority, memoryPriority, preferredPhaseRange },
  systemInferenceProfile: { phase, stabilityScore, deformationScale, volatility },
  negotiatedPhaseRange: { min, max, systemPhase, resolvedPhase, blendedIndex },
  allowedDeformationRange: { min, max, resolved },
  interactionContract: true
}
```

---

## Three user roles

| Role | Examples | Signals |
|------|----------|---------|
| **Stability Steering** | “daha hızlı cevap”, “maç modunda kal”, “arkaya at” | `fast_explain`, `accelerate`, `sustain_mode`, `background_thread` |
| **Reality Correction** | “yanlış anladın”, “bunu önemseme”, “şu thread önemli” | `wrong_understanding`, `deprioritize`, `prioritize_thread` |
| **Phase Override** | “sohbet moduna geç”, “dondur”, “sadece dinle” | `switch_social`, `cut_freeze`, `listen_only` |

Anti-sterilization: `add_aliveness` lifts deformation floor when governance feels flat.

---

## Scenario examples

**YouTube + maç + “bana hızlı açıkla”**
- System: co-watch dominant, transitional phase
- User: fast explain → `user_leans_fast`
- Result: phase shifts toward stable, deformation drops, speech priority rises

**Audiobook + gece + “bana özet çıkar”**
- System: observer mode bias
- User: summarize request
- Result: speak suppressed, memory writes increase, `summarySpikeScheduled`

---

## API

```javascript
window.__rhizoh.submitStabilityFeedback("fast_explain")
window.__rhizoh.lastOsLoop.stabilityAgreement
window.__rhizoh.lastOsLoop.coGovernorState
window.__rhizoh.lastOsLoop.coGovernance
```

Voice ingress auto-parses Turkish/English steering phrases when `userInitiated: true`.

---

## v1.7 horizon

**Stability Memory Learning Loop** — user + system jointly learn a personal physics profile across sessions.
