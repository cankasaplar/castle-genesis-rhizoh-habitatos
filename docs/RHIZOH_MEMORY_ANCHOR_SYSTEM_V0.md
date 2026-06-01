# Rhizoh — Anchor System v0 (SSOT)

**Status:** ACTIVE — product + client SSOT  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md`](RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md) · [`RHIZOH_L2_ENTITY_CORE_V0.md`](RHIZOH_L2_ENTITY_CORE_V0.md) · [`RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md`](RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md)

---

## Locked sentences

| Key | Sentence |
|-----|----------|
| **Binding** | Every user has a personal origin, but all origins **emerge** within a shared seeded topology. |
| **Product spine** | Rhizoh does not center users. It seeds continuities. |
| **Continuity physics** | Rhizoh does not optimize for user centrality; it optimizes for **continuity coherence**. |
| **Engine (one line)** | Rhizoh is a **continuity engine** built on semantic gravity seeds and real-time perceptual transitions. |
| **Experience closure** | Rhizoh does not store experience. It stabilizes continuity across time, space, and interaction. |
| **Serencebey** | Semantic seed, not narrative center — bootstrap gravity point, not origin center. |

**Turkish:** Rhizoh bir harita sistemi değil — **memory geography** sistemidir.

Code constants: [`memoryAnchorSystemV0.js`](../apps/client/src/rhizoh/runtime/memoryAnchorSystemV0.js).

---

## 0. Four locked layers (honest system read)

| Layer | Name | What it holds |
|-------|------|----------------|
| **1** | **Memory graph (L1)** | events · turn · note · link — continuity field, not a data warehouse |
| **2** | **Anchor system (L2 semantic gravity)** | user origin · cohort origin · seed origin (Serencebey) |
| **3** | **RTL (temporal perception)** | entry moment · micro transitions · PAL re-entry |
| **4** | **Surface (E2-X)** | map · studio · chat · academy |

**Architectural truth:** Rhizoh is not a classic AI app that **outputs** answers; it **generates a continuity field**.

| Paradigm | Optimizes for |
|----------|----------------|
| Classic AI app | Output |
| Rhizoh | **Continuity coherence** (not user-centrality as UX default) |

---

## 1. Temel doğrulama — seed, not center

| ❌ | ✅ |
|----|-----|
| Serencebey = tek başlangıç / origin center / narrative hub | Serencebey = **semantic seed generator** · **bootstrap gravity point** |
| Sistemin “başlangıcı” | Sistemin **“başlama olasılığını üreten yeri”** |

| Node | Role |
|------|------|
| Serencebey | `seed node` |
| User | `generated origin node` |
| Cohort | `emergent cluster node` |

Deploy override only: `VITE_RHIZOH_ORIGIN_SEED_LABEL`, `VITE_RHIZOH_ORIGIN_SEED_PLACE`.

---

## 2. Anchor model (product + engineering)

**Product:**

```text
AnchorSystemV0 = {
  origin_seed: SerencebeyCastle,
  user_anchor: first_meaningful_thread,
  cohort_anchor: first_shared_interaction_cluster,
  derived_links: L2_graph_edges
}
```

**Engineering (`ANCHOR_ENGINEERING_MODEL_V0`):**

```text
AnchorV0 = {
  type: semantic_gravity_seed | user_origin | cohort_cluster,
  stability: immutable | versioned | mergeable,
  function: continuity_attractor
}
```

**Insight:** Not a plain graph system — an **attractor-based continuity system**. A node is not “a row of data”; it is a **semantic density** point.

---

## 3. Emotional anchor

**Emotional anchor** = the node where **first meaningful continuity** formed (not location · label · `castle_id` alone).

---

## 4. Anchor types & product physics

| Type | Role | Stability | Emergence |
|------|------|-----------|-----------|
| **A — Origin** | Serencebey · reference producer only | **Seed invariance** — immutable | — |
| **B — User** | First meaningful continuity · thread + memory + interaction | **User origin mutability** — grows, rewrites, versioned timeline | — |
| **C — Cohort** | Invite chain → cluster memory | **Cohort emergence** — merge · split allowed; **never hard-delete** | — |

---

## 5. Growth — shared continuity field

| ❌ | ✅ |
|----|-----|
| Social graph | **Shared continuity field** |

---

## 6. Serencebey — semantic gravity seed

| Wrong | Right |
|-------|-------|
| Meaning center → semantic monoculture | Gravity **producer** |
| All user anchors bound to seed → perceptual collapse | Seed topology without narrative monopoly |

---

## 7. Three time scales (with Micro-RTL)

| Scale | Mechanism | Layer |
|-------|-----------|-------|
| **Real-time** (interaction) | Micro-RTL pulses | RTL |
| **Session-time** (continuity) | L1 memory graph + L2 anchors | Memory + anchor |
| **World-time** (topology) | Serencebey seed + cohort graph | Anchor topology |

| Concern | Layer |
|---------|-------|
| Anchor | spatial memory |
| RTL | temporal transition |
| Micro-RTL | interaction pulse |

---

## 8. Micro-RTL integration

Bridge: [`rhizohConversationRtlBridgeV0.js`](../apps/client/src/rhizoh/product/rhizohConversationRtlBridgeV0.js) · [`rhizohQueryLlmV1.js`](../apps/client/src/rhizoh/runtime/rhizohQueryLlmV1.js).

| Event | API |
|-------|-----|
| Chat | `triggerMessageMicroRtlV0()` |
| Thread | `triggerThreadSwitchMicroRtlV0()` |
| Story / phase | `triggerStoryShiftMicroRtlV0()` |
| Map / PAL | `triggerMapAnchorPulseV0()` |

Display priority: **user > cohort > PAL > seed** · strip: [`ExpressiveRealityEmotionalAnchorStripV0.jsx`](../apps/client/src/rhizoh/runtime/ExpressiveRealityEmotionalAnchorStripV0.jsx).

---

## 9. Anchor balance field & drift monitor (ops)

As the system scales, risks include:

- user anchor **collapsing back** to Serencebey display
- cohort anchor **dominating** personal origin

**Observation-only** module: [`anchorDriftMonitorV0.js`](../apps/client/src/rhizoh/runtime/anchorDriftMonitorV0.js)  
API: `recordAnchorBalanceSampleV0` · `computeAnchorBalanceFieldV0` · `getAnchorDriftWarningsV0` · `observeAnchorBalanceFieldV0()`.

Warning codes (examples): `seed_dominance` · `cohort_dominance` · `user_anchor_collapse_to_seed`.

*Agents may influence interpretation, never execution* — drift output is for ops / trust debug, not automatic routing.

---

## 10. Related

| Doc | Role |
|-----|------|
| [`RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md`](RHIZOH_E2X_PRODUCT_REALITY_AND_MODE_TRANSITION_V0.md) | RTL + surfaces |
| [`RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md`](RHIZOH_ACADEMIC_OBSERVATORY_LAYER_V0.md) | Externalize |

---

*Anchor System v0 — attractor-based continuity on a seeded topology. Continuity-centric system physics.*
