# Rhizoh L1 — Life Continuity Layer v0 (Product SSOT)

**Status:** ACTIVE — **scope freeze** (product layer; not repo epistemic Phase 1)  
**SPECFLOW:** `FUTURE-PROOF-ONLY` — defines **what** L1 is; implementation follows this doc + legal addendum  
**As of:** 2026-06-01  
**One-line:** *architecture ≠ product* — control plane may be live while **daily return value** is defined here.

**Binding product sentence:**

> Rhizoh L1 is a **continuity layer**, not an intelligence layer. Models, prompts, and gateway routing may change; **life map, relationship threads, and personal continuity** persist.

**Success test (L1 started):** User asks *“Geçen pazartesi konuştuğumuz şeyi hatırlıyor musun?”* — system surfaces **evidence-linked recall** (thread + date + excerpt), not invented narrative.

---

## 0. Naming lattice (do not conflate)

| Code | Name | Question answered | Repo “Phase” overlap |
|------|------|-------------------|----------------------|
| **P0.5** | Control Plane Live | Can we host, route, cohort-gate, and turn LLM safely? | [`RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md`](RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md) — Phase **0.5** |
| **E1** | Epistemic Witness | Can **one** external signal enter **without corrupting core / WAL**? | [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) — repo **Phase 1** (`device_heartbeat_v1`) |
| **L1** | Life Continuity | Can Rhizoh **carry the user’s digital life thread** across days? | **This document** — **not** repo Phase 1 |
| **L2** | Entity + Projection Bridge | What **things** exist (castle, location) and how UI **projects** them? | [`RHIZOH_L2_ENTITY_CORE_V0.md`](RHIZOH_L2_ENTITY_CORE_V0.md) |
| **L2-trust** | Trust / pattern maps | Reliability **read** surfaces only | Deferred |
| **L3** | Visual Language | How is process **shown** (crystal, wave, geometry)? | [`RHIZOH_CUBE_FIELD_V0.md`](RHIZOH_CUBE_FIELD_V0.md) — research / perception |

**Deploy ≠ activation** (ops) · **Architecture ≠ product** (user value).

Orthogonal roadmap (older A→E product freeze): [`RHIZOH_PRODUCT_PHASES_A_THROUGH_E.md`](RHIZOH_PRODUCT_PHASES_A_THROUGH_E.md) — Companion (Phase B) **implements** L1 UX; L1 **defines** continuity contract.

**Freeze vs surface:** Core frozen · experience live — [`RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md`](RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md).

---

## 1. What L1 is / is not

| L1 **is** | L1 **is not** |
|-----------|----------------|
| Durable **threads** across Castle chat sessions | A new “smarter model” or oracle |
| User **notes** and **links** attached to threads | Profiling, scoring, or automated decisions |
| **Summaries** (daily / weekly) as **projections** | Writes to frozen execution core / L1 WAL |
| **Return paths** to prior conversations | Studio, Spiral, calendar, files, voice, video (L1-alpha) |
| Model-agnostic **continuity store** | `device_heartbeat_v1` or ops witness (that is **E1**) |

**Observation ≠ Execution:** recall and summaries **display** stored continuity; they **must not** branch admission, routing, seal graph, or cohort gates. See [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md).

---

## 2. L1-alpha — frozen scope (v0)

### 2.1 Inputs — IN

| Input | Source | Notes |
|-------|--------|-------|
| **Castle chat turns** | Gateway turn + client continuity envelope | User + assistant text; `correlationId` / `sessionId` per turn |
| **User notes** | Explicit user-authored text in Rhizoh UI | Not inferred from chat; user must save |
| **Links** | User-pasted URLs with optional title | No automatic page scrape in L1-alpha |

### 2.2 Inputs — OUT (explicit NO until L1-beta+)

| Excluded | Reason |
|----------|--------|
| Files / uploads | Storage, malware, retention class — separate legal + infra gate |
| Calendar / tasks | New data categories + sync integrations |
| Voice / video | Transcription pipeline + consent class |
| Email / SMS / external apps | Data-plane breadth; not P0.5 cohort scope |
| SpiralMMO / Studio | [`PHASE2_CONTROLLED_REALITY_TEST_V1.0.md`](ops/PHASE2_CONTROLLED_REALITY_TEST_V1.0.md) — OFF for cohort |
| Implicit “memory” from model | Model may **read** continuity projection; **must not** be sole store of truth |

### 2.3 Outputs — IN (user-visible)

| Output | Cadence | Rule |
|--------|---------|------|
| **Daily summary** | End of local day or first visit next day | Projection from threads; cite thread ids |
| **Weekly summary** | Rolling 7d | Same; no personality claims |
| **Linked memories** | On demand + in summaries | Note ↔ chat ↔ link edges; user can dismiss |
| **Return to prior conversation** | Any time | Open thread by date/title/search; show transcript slice |

### 2.4 Outputs — OUT (L1-alpha)

| Excluded | Deferred to |
|----------|-------------|
| Trust scores / “reliability” UI | L2 |
| Behavior pattern maps | L2 |
| Visual / geometric expression of thought | L3 |
| Cross-user or public graph | Never in L1 |

---

## 3. Data contract (what we keep / do not keep)

**Machine SSOT:** [`schemas/life-continuity-v0.schema.json`](schemas/life-continuity-v0.schema.json) · **Retention / erasure:** [`schemas/life-continuity-v0.retention.json`](schemas/life-continuity-v0.retention.json) · **Example:** [`schemas/fixtures/life-continuity-v0-minimal.example.json`](schemas/fixtures/life-continuity-v0-minimal.example.json)

JSON field names use `snake_case` in schema; UI may map to camelCase at the membrane.

### 3.1 Stored (L1-alpha)

| Artifact | Fields (minimal) | Retention (default) | Store class |
|----------|------------------|---------------------|-------------|
| **Thread** | `thread_id`, `user_id`, `title`, `created_at`, `updated_at` | User account lifetime; erase on request | **Life store** (not execution WAL) |
| **Turn** | `turn_id`, `thread_id`, `role`, `text`, `at`, `correlation_id` | Same | Life store |
| **Note** | `note_id`, `thread_id?`, `body`, `at` | Same | Life store |
| **Link** | `link_id`, `url`, `title?`, `thread_id?`, `at` | Same | Life store |
| **Summary projection** | `period`, `body`, `source_turn_ids[]`, `generated_at` | 90d rolling (configurable) | `life_store_projection` — regenerable |

### 3.2 Not stored (L1-alpha)

| Category | Policy |
|----------|--------|
| Raw provider LLM logs beyond turn text | Provider retention only; Rhizoh stores **display contract** text |
| Biometrics, location, device fingerprint | **E1** class only if counsel approves — not L1-alpha |
| Inferred traits (“user is anxious”, “user likes X”) | Forbidden as **persistent** fields |
| Full-page scrape of pasted URLs | Forbidden in alpha |

### 3.3 Causal isolation (technical law)

| Allowed | Forbidden |
|---------|-----------|
| Life store append/read for L1 UX | Life events → `phase*.js` / sealed WAL / admission |
| Gateway **reads** continuity projection for prompt | Heartbeat or observation volume → routing changes |
| User-initiated erase / export | Silent expansion of data classes without counsel row |

Aligns with [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) S1–S4. L1 is a **product data-plane** for user-owned continuity — **orthogonal** to epistemic core state.

---

## 4. First user benefit (one screen)

**Primary:** *“Rhizoh remembers what we were doing.”*

| UI surface | Behavior |
|------------|----------|
| **Continuity strip** (existing cohort surface) | Extends from visit echo → **last thread title** + “continue” |
| **Today / This week** | Two calm summary cards; tap → source threads |
| **Threads list** | Chronological; search by keyword |
| **Ask back** | User question → ranked excerpts + dates (not free-form fiction) |

**Tone:** [`RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md`](RHIZOH_CALM_TECHNOLOGY_PRINCIPLE.md) — no gamification, no trust sliders in L1-alpha.

---

## 5. P0.5 inventory vs L1-alpha gap

| Already live (P0.5) | L1-alpha gap |
|---------------------|--------------|
| Hosting, legal ingress, cohort gate | Durable **server-side** life store (vs device-only) |
| Gateway `rhizohGatewayTurn` + continuity in prompt | **Structured** thread/turn persistence contract |
| `rhizohProductSessionPersistenceV1` (localStorage + meta) | Merge into life store; multi-device replay |
| `identityNarrative` / weighted recollection in gateway | Replace ad-hoc narrative with **thread SSOT** |
| Session continuity strip / visit echo | Wire to **real thread** ids |
| Stabilization graph, observation sim | L1 store **must not** feed tick/WAL |

**Honest line:** P0.5 proves **safe conversation**; L1-alpha proves **safe return**.

---

## 6. Legal & ops gates (before cohort-wide L1)

| Gate | Doc / action |
|------|----------------|
| Data classes in privacy notice | Extend [`PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md`](legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md) — “Life store” row |
| Erasure | User request deletes life store + projections; no orphan summaries |
| Cohort copy | “Closed test — continuity memory for your threads” (not “we profile you”) |
| `VITE_RHIZOH_PHASE1_SIGNAL` | **Unrelated** to L1-alpha — E1 only |
| Frozen `*V0` runtime spine | No new epistemic primitives; L1 = **habitat module** + store schema |

---

## 7. Implementation sequence (after this SSOT)

| Order | Deliverable | Owner |
|-------|-------------|-------|
| 1 | **This doc** — scope frozen | Product SSOT ✔ |
| 2 | `life_continuity_v0` JSON schema + retention rules | Spec ✔ — [`schemas/life-continuity-v0.schema.json`](schemas/life-continuity-v0.schema.json) · [`schemas/life-continuity-v0.retention.json`](schemas/life-continuity-v0.retention.json) |
| 3 | Life store — [`lifeContinuityStoreV0.js`](../apps/gateway/src/rhizoh/lifeContinuityStoreV0.js) ✔; Firestore persist next | Engineering |
| 4 | Recall — [`lifeRecallEngineV0.js`](../apps/gateway/src/rhizoh/lifeRecallEngineV0.js) deterministic citations ✔ | Engineering |
| 5 | Gateway hook — [`lifeContinuityGatewayHookV0.js`](../apps/gateway/src/rhizoh/lifeContinuityGatewayHookV0.js) · `CASTLE_LIFE_CONTINUITY_APPEND=1` ✔ | Engineering |
| 6 | Gateway: load projection slice → existing continuity envelope | Engineering |
| 7 | UI: threads + daily/weekly summary + “continue” | Product |
| 8 | Cohort MODE 2 smoke: Monday recall test | Ops |

**Gateway env (ops):**

| Flag | Meaning |
|------|---------|
| `CASTLE_LIFE_CONTINUITY_APPEND=1` | After each authed `/rhizoh/llm` turn → `appendTurn` user + assistant |
| `CASTLE_LIFE_CONTINUITY_RECALL=1` | On recall-shaped user message → attach `lifeContinuityRecall` citations to response (no LLM interpretation) |
| `CASTLE_LIFE_ENTITY_RESOLVER=1` | After append → L1→L2 resolver + `lifeEntityProjection` bundle — [`RHIZOH_L2_ENTITY_CORE_V0.md`](RHIZOH_L2_ENTITY_CORE_V0.md) |
| `CASTLE_PROJECTION_ACTIVATION=1` | Apply PAL v0 thresholds on projection — [`RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md`](RHIZOH_PROJECTION_ACTIVATION_LAYER_V0.md) |

**Recall mode:** Path **A** only — `deterministic_token_match_v0` (no embeddings).

**Parallel (do not block L1 spec):** E1 / MANUAL READY / `device_heartbeat_v1` — ops track only.

---

## 8. Non-goals (locked for v0)

- Proving Rhizoh’s “mind” via geometry or crystals (**L3**)
- Global node / live telemetry narrative (**E1+**)
- Studio / Spiral as L1 inputs
- Using L1 data to change execution authority
- Marketing claims of “total digital life integration” before §2.2 OUT list thaws

---

## 9. Related documents

| Concern | Doc |
|---------|-----|
| Ops phase 0.5 / E1 | [`RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md`](RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md) |
| Cohort prod flags | [`DEPLOY_MATRIX_V1.0.md`](../apps/client/docs/DEPLOY_MATRIX_V1.0.md) |
| Control plane law | [`RHIZOH_CONTROL_PLANE_V1.md`](RHIZOH_CONTROL_PLANE_V1.md) |
| Layer expansion | [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md) |
| Companion journey | [`RHIZOH_COMPANION_REFERENCE_JOURNEY.md`](RHIZOH_COMPANION_REFERENCE_JOURNEY.md) |

---

*L1 Life Continuity v0 — product SSOT. Repo Phase 1 remains E1 Epistemic Witness only.*
