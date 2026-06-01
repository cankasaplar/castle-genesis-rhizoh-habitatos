# Rhizoh — Action Coherence Layer (ACL) v0 (SSOT)

**Status:** ACTIVE — navigation gravity alongside cognition exposure  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md`](RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md) · [`RHIZOH_THINKING_MODEL_V0.md`](RHIZOH_THINKING_MODEL_V0.md) · [`RHIZOH_HONEST_COGNITION_SURFACE_V0.md`](RHIZOH_HONEST_COGNITION_SURFACE_V0.md) · [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md)

**Binding sentence (locked):**

> **Rhizoh is cognition exposure + action coherence + continuity stabilizer** — not a cognition display system alone, and not a UI shell alone.

**User question balance (locked):**

| System answers | User needs |
|----------------|------------|
| “How does Rhizoh think?” | “What can **I** do?” |

**Risk named (locked):** **Over-exposure cognition** — beautiful depth, passive spectator, lost direction.

---

## 1. Triple stack (must co-exist)

| Layer | Role | Modules |
|-------|------|---------|
| **1. Cognition** | Thinking exposure · field deformation | Thinking model · VCL · honest ambient |
| **2. Navigation (ACL)** | Next action clarity · non-coercive pull | `resolveNextActionAnchorV0` |
| **3. Stability (Honest Baseline)** | Direction preserved · overload capped | `computeCognitionExposureBudgetV0` |

**4. Rhythm (ARL):** [`RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md`](RHIZOH_ATTENTION_RHYTHM_LAYER_V0.md) — *when* each vertex leads (silence · direction · cognition pulse · stabilize quiet).

**Basketball:** Playbook + transitions + spacing are visible — but the player must still know **where to move next**. If they only watch the system, they stop playing. **Dead ball** = ARL silence — field feel without coach voice.

---

## 2. Next Action Anchor (v0)

A **gravity point**, not a command. Shown on T0 continuity rail — always readable during and after thinking phases.

| Surface | Anchor (tr) | Anchor (en) |
|---------|---------------|-------------|
| `studio` | Üretim alanı açık | Production space open |
| `world` | Keşif alanı aktif | Exploration field active |
| `broadcast` | Bağlantı alanı aktif | Connection field active |
| `hall` | Süreklilik devam ediyor | Continuity in progress |
| `greenroom` | Canlı hazırlık alanı | Live prep space |
| `profile` | Kimlik çapası görünür | Identity anchor visible |

During **thinking** (not rest): shorter **hold direction** line — e.g. *Yönün korunuyor · üretim alanı* — so cognition never steals the only headline.

---

## 3. Over-exposure guard (Stability)

`computeCognitionExposureBudgetV0` scales ambient / defers decorative phase noise when:

- Thought field **on** + thinking **busy** → ambient capped (~55% opacity scale)
- Anchor emphasis **high** while busy → Next Action Anchor leads UI

Principles: stimulating cognition · **navigation always visible** · minimal overload.

---

## 4. Integration map

| Module | Role |
|--------|------|
| [`rhizohActionCoherenceV0.js`](../apps/client/src/rhizoh/runtime/rhizohActionCoherenceV0.js) | Anchor resolve · exposure budget |
| [`RhizohNextActionAnchorV0.jsx`](../apps/client/src/rhizoh/runtime/RhizohNextActionAnchorV0.jsx) | Rail UI chip |
| [`T0ContinuitySurfaceRailV0.jsx`](../apps/client/src/rhizoh/runtime/T0ContinuitySurfaceRailV0.jsx) | Mount anchor below context strip |
| [`RhizohHonestCognitionAmbientV0.jsx`](../apps/client/src/rhizoh/runtime/RhizohHonestCognitionAmbientV0.jsx) | `ambientScale` from budget |

Event: `rhizoh:next-action-anchor` (detail = anchor payload).

---

## 5. Related

| Doc | Role |
|-----|------|
| [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md) | Field dialect |
| [`RHIZOH_THINKING_MODEL_V0.md`](RHIZOH_THINKING_MODEL_V0.md) | Phase map |

---

*ACL v0 — show thinking; never hide the next move.*
