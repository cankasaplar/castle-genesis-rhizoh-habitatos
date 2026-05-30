# Rhizoh + Castle Genesis — Production Architecture v1

**Tag:** `RESEARCH-ONLY` (habitat wire) + `CORE-ELIGIBLE` (execution core boundaries only)  
**Status:** Implementable production map aligned with `castle-system` monorepo and **EFIR-α** ([`TEMPORAL_IDENTITY_CONTINUITY_V0.md`](../apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md) §23).

**System definition:** A distributed spatial-event platform where users create geographic **Castle** nodes, global **Rhizoh** correlates events, renders multi-node interactions in 3D, and supports AI companion agents. **Not** a game engine. **Not** a simple map app.

**Kanonik invariant (supreme):** *No derived layer may influence any upstream epistemic authority.*  
**Epistemic data flow (EFIR-α):** `EXTERNAL → REAL → DERIVED → NARRATIVE` — **irreversible** after validated ingest (see §0).  
**Execution flow (frozen core):** `Execution → Events → Visualization → UI` (never reverse).

**Technical class:** Append-only, externally-fed, internally-deterministic event processing system with strict causality boundaries.

**System identity (engineering):** Rhizoh = **multi-source untrusted ingestion** + **deterministic derivation** + **strictly separated narrative rendering**. Vision may speak of universal epistemic infrastructure; **deployable claims** are verifiable guarantees only (§0.0).

**Founder constitution (culture, non-executable):** [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) — *continuity-first*, frozen core as launch ramp, LLM as replaceable motor, honest baseline over attention economy.

---

## 0. EFIR-α — Four-layer constitutional separation (upper law)

**Status:** Production-grade epistemic constitution. **Overrides** any doc, UI copy, or agent prompt that implies downward causality, pseudo-physics, narrative back-write, or “external AI as equal actor.”  
**Tag:** `CORE-ELIGIBLE` (membrane + CI targets) · companion to [`TEMPORAL_IDENTITY_CONTINUITY_V0.md`](../apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md) §23 · external producers: [`EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md`](EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md).

This section is a **Reality Contract**, not criticism of prior research language. Laboratory metaphors (viscosity, field bend, storm resonance) are **valid only in Narrative (D)** when **Derived (C)** supplies a replayable function output and **Real (B)** supplies a traceable source chain including validated external ingest.

### 0.0 Engineering language (claims vs goals)

| Design goal (vision) | Deployable claim (docs + ops) |
|----------------------|-------------------------------|
| Universal epistemic infrastructure | Multi-tenant event ingestion with shared schemas |
| “Cannot be manipulated” | **Manipulation is detectable**; tamper attempts logged and flagged |
| “Immune system” | **Causal divergence flagged** → `DEGRADED` / `QUARANTINE` |
| “Perfect forensics” | **Deterministic audit trail** — replayable from append log + versioned `F_v` |
| External AI “feeds freely” | **Controlled, schema-bound, rate-limited event producers** ([`EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md`](EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md)) |

**Do not write in production docs:** “asla manipüle edilemez”, “bağışıklıklıdır”, “kusursuz doğruluk”.  
**Do write:** “state changes are auditable”, “divergence is flagged and quarantined”, “every derived value traces to `event_chain`”.

### 0.1 Layer definitions

| Layer | Code | Role | Accepts | Rejects |
|-------|------|------|---------|---------|
| **External input** | **X** | Untrusted producer surface (Lab AI, plugins) | Signed, schema-valid **`InfraEventEnvelopeV1`** proposals at gateway only | Compute, execution, direct B/C write |
| **Real** | **B** | Validated measurable substrate | Post-gateway ingest: WGS84, API JSON, WAL append, registry rows — **immutable at commit** | Unvalidated payloads; metaphor as fact |
| **Derived** | **C** | Deterministic mathematical manifold | `computeViscosity()`, `density(x,y,t)`, latency matrices, `resonanceScore = f(event_chain)` | “Felt density”, agent prose as score |
| **Narrative** | **D** | Semantic projection only | Cesium fog, companion strings, UX ritual | Writes to C/B/X; metrics without C trace |

> **Letter codes:** X = external ingress · B/C/D = internal epistemic stack (historical A/B/C docs map: old A→B, B→C, C→D).

**Components (X — External):** Lab AI HTTP/WS producers, plugin host (`packages/plugin-host` target), gateway validation firewall — **no compute rights**.

**Components (B — Real):** geographic anchors, weather/traffic after ingest, append-only log + WAL, satellite registry projections.

**Components (C — Derived):** heatmaps, resonance, `epi_sig_*` from deterministic fingerprint.

**Components (D — Narrative):** Cesium, `@Rhizoh` / `@Atlas` / `@Ghost`, onboarding copy.

### 0.2 Irreversibility law (inter-layer)

Layers connect only through **typed transition rules**:

```
EXTERNAL ──(validate, sign, rate-limit)──► REAL ──(append, timestamp)──► DERIVED ──(F_v, replay)──► NARRATIVE
```

| Transition | Allowed | Forbidden |
|------------|---------|-----------|
| X → B | Validated ingest only (`immutable_ingestion_only` after accept) | Raw external → Real without gateway |
| B → C | Deterministic transforms with `event_chain` trace | — |
| C → D | Render / phrase under policy filter | — |
| D → C,B,X | — | ❌ Any downward write |
| C → B,X | — | ❌ Derived → Real / External |
| B → X | — | ❌ Real → External |

**External security core:**

```text
∀ external_event E  ⇒  ingest(E) is append-only after gateway validation (no in-place mutation)
∀ ingestion I       ⇒  verifiable + timestamped + traceable (signer, schemaVersion, seq)
∀ derived_state S   ⇒  ∃ event_chain E : S = F_v(E)
```

**Actor model:** External Lab AI = **untrusted data source** — not an epistemic peer, not an execution actor.

### 0.2.1 Lab AI production pipeline (reference)

| Stage | Responsibility |
|-------|----------------|
| 1 Validation gateway | Schema · signature · rate limit · auth |
| 2 Ingestion | Append-only log · WAL commit |
| 3 Derived recompute | `computeViscosity` / resonance · **divergence detection** |
| 4 Narrative | `@Atlas` / `@Rhizoh` interpret **D** only (from C) |

Spec: [`EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md`](EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md).

Vertical leakage is an **epistemic security** violation, not merely a style issue.

### 0.3 Derived layer contract

Every Derived artifact MUST be:

- **Deterministic** — same inputs + version → same output  
- **Replayable** — reproducible from stored `event_chain` (B-layer commits)  
- **Versioned** — function/schema id in trace metadata  
- **Auditable** — inverse check: score → formula → inputs  

**Not Derived (classify as Narrative):** “interpreted feeling”, “situational guess”, agent-authored story scores, empty metaphor without `f(real)`.

### 0.4 Narrative layer contract

Narrative **does not explain** data and **does not re-produce** data — it **renders** Derived (and only via Derived) for humans and companions.

- ❌ Wrong: Atlas says “Ankara feels dense” because the model inferred mood.  
- ✔ Right: Atlas reads `densityScore > 0.7` (C) and emits a **constrained** phrase under companion policy (D).

If `computeViscosity()` (or successor) and Real API traces are absent → **silence or neutral baseline** — never ARG/hollow physics copy.

### 0.5 Reality seal (verifiable invariants)

Register in code reviews, membranes, and agent contracts:

```text
∀ narrative_output N  ⇒  ∃ derived_ref R  :  N = render(R, policy)     [R from layer C]
∀ derived_state S       ⇒  ∃ event_chain E :  S = F_v(E)               [E includes B commits]
∀ external_event e ∈ E ⇒  gateway_validated(e) ∧ append_only_commit(e) [layer X→B]
```

**Captain rule (production):** *No physical-world effect may be **presented as** real without validated Real ingest + deterministic compute — violations are **flagged**, not silently corrected.*

Narrative richness **scales with** Derived availability; it **never compensates** for missing traces.

### 0.6 Agents — Semantic interpreter, not physics engine

| ❌ Wrong | ✔ Correct |
|----------|-----------|
| Agent = commenting consciousness / mini-god simulating weather | Agent = **deterministic renderer + policy filter** on Derived state |
| `@Atlas` runs hidden physics | `@Atlas` consumes `derived_state` → `constrained_narrative_string` |

**Reference flow (Guardian node, e.g. Ankara):**

```
[X] Lab AI observation envelope (signed, schema-valid) ──► gateway accept
      │
      ▼
[B] Weather API + Traffic API + registry + ingested external events
      │
      ▼
[C] computeViscosity() → densityScore = 0.88 (logged, replayable)
      │
      ▼
[D] @Atlas (policy-bound): "Ankara düğümünde uzamsal direnç yüksek."
```

Without [C], [D] MUST NOT emit “Ankara bükülüyor, alan gerildi” or equivalent pseudo-physics.

Applies to **`rhizoh` · `atlas` · `ghost`** (`companionAgentRegistryV1.ts`): `executive: false`, `suggestionOnly: true`, **no** `bootValidityToken` writes.

### 0.10 Source provenance tagging (anti semantic-trust-creep)

**Risk:** Lab AI and polished UI make Derived/Narrative **feel** equally authoritative — epistemic boundary blurs in the operator’s mind.

**Rule:** Every **D-layer** user-visible string (companion, narrator, ritual copy with factual claim) SHOULD ship with frozen provenance metadata:

```json
{
  "source_chain": ["lab.observation.snapshot", "weather.api", "computeViscosity.v2"],
  "trust_class": "untrusted_external_origin",
  "derivation_depth": 3,
  "provenance_summary": {
    "dominant_source": "computeViscosity.v2",
    "confidence_shape": "drifting"
  },
  "provenance_fold_reason": "length_limit",
  "provenance_fold_count": 4,
  "provenance_entropy_delta": 0.42
}
```

| Field | Meaning |
|-------|---------|
| `source_chain` | Ordered B/C layer ids — **capped at 8 hops** (`meta.provenance_folded:N` if trimmed) |
| `provenance_fold_reason` | `dedupe` \| `length_limit` \| `low_entropy_merge` \| `null` — **why** chain was normalized (audit) |
| `provenance_fold_count` | Hops removed or folded |
| `provenance_entropy_delta` | **0–1** — relative Shannon hop-family diversity **loss** (pre-fold vs stored chain); academic/audit metric |
| `trust_class` | `untrusted_external_origin` \| `trusted_internal_derived` \| `mixed_origin` \| `baseline_no_signal` |
| `derivation_depth` | Logical depth before cap (audit) |
| `provenance_summary` | **UI digest** — do not render full chain in prod |

| `provenance_summary` field | Meaning |
|----------------------------|---------|
| `dominant_source` | Single primary hop (prefer last `compute*`) |
| `confidence_shape` | `stable` \| `drifting` \| `sparse` — readability + inflation guard |

**Anti-pattern:** *provenance inflation* — ever-longer chains that hurt narrative readability. **Rule:** UI shows `provenance_summary` only; full `source_chain` for captain export / debug.

**Module:** `apps/client/src/rhizoh/runtime/narrativeSourceProvenanceV0.js` · Studio: `stubCompanionNarrativeOutputV1` · Captain: `window.__rhizoh.narrativeProvenance`.

**UI guidance (non-normative):** Prod badge: `dominant_source` + `confidence_shape`; expand to full chain only in debug.

**Integrity:** §7 `layerTrace` fails on orphan narrative (text without valid provenance tag).

### 0.7 Anti-patterns (explicit ban)

| Risk | Symptom | Remedy |
|------|---------|--------|
| **Pseudo-physics temptation** | Small heuristics marketed as “universe simulation” | Keep heuristics in B with versioned `F_v`; poetic scale only in C |
| **Narrative leakage** | Filling API gaps with story | Baseline UI + explicit “no derived signal” state |
| **Semantic overreach** | D vocabulary in C modules (e.g. “viscosity” without formula) | Rename or implement `F_v`; metaphors stay in D |
| **External AI elevation** | Lab AI treated as epistemic equal / executor | X = untrusted source only; see External spec |
| **Semantic trust creep** | Narrative “feels true” without chain | §0.10 provenance on every D output |

### 0.8 Mapping to this document’s zones

| §0 layer | §7 trust zone | Typical paths |
|----------|---------------|---------------|
| X External | T1 gateway ingress (untrusted) | `apps/gateway` validation, `InfraEventEnvelopeV1`, plugin ACL |
| B Real | T2 append-only log | `satelliteNodeRegistryV0`, weather/traffic ingest, WAL |
| C Derived | T2–T3 projections | `crossNodeCausalResonanceV0`, compression signature |
| D Narrative | T4 (viz / UI / AI) | Cesium, companions, onboarding — **not** plugin write |

**Frozen execution core (v562–v570)** remains **orthogonal**: seal/hydrate authority is separate from A/B/C epistemic presentation — but **must not** be opened by C or B (existing membrane).

### 0.9 Engineering verdict (honest)

| Dimension | Status |
|-----------|--------|
| Architecture coherence | 🟢 Strong — ESM identity explicit |
| Epistemic safety | 🟢 Raised — irreversibility + seal |
| Narrative risk | 🟡 Controlled — requires CI/agent policy enforcement |
| Production readiness | 🟢 On track — Guardian anchors exercise Real→Derived→Narrative |
| Scientific credibility | 🟢 Approaching instrumentation-grade |

**Threshold:** Success is not “demo looks beautiful” but **“misrepresentation is detectable, logged, and quarantine-eligible under §0.”**

---

## 1. System architecture diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CLIENTS (Browser / Studio / Mobile Web)                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  UI Shell (React)          Interaction Engine        Dev & Tooling Layer         │
│  ├─ AppRhizoh528           ├─ Nav / gestures         ├─ Debug console            │
│  ├─ Studio panels          ├─ Node selection         ├─ Event inspector           │
│  └─ Onboarding / UX FSM    └─ Camera (fly/orbit)    ├─ Replay viewer            │
│                                                       └─ Trace exporter           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Visualization Engine (read-only projection)                                     │
│  I3DEngine ──► CesiumAdapter (prod) │ ThreeAdapter / WebGPUAdapter (future)     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  AI Companion Layer (C — Narrative; §0) — suggestion-only, §8               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Causal Field (EFIR-α) — B/Derived + event log; append-only, non-executive      │
│  Event Bus ─► Correlation ─► Replay ─► Compression/Signatures                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Node System — Castle nodes │ Satellite registry │ Shadow continuity (IDB)       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Execution Core (IMMUTABLE — frozen v562–v570 + seal chain)                      │
│  bootValidityToken │ mayRehydrate │ sealed runtime snapshot                        │
│  ▲ NO INBOUND from Event / Viz / AI / Plugins                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
          │ HTTPS/REST         │ WebSocket              │ Firebase SDK
          ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  apps/gateway — Auth │ Genesis │ Event ingress │ agentIdentityStore               │
│  apps/worker │ apps/orchestrator │ apps/sfu │ functions │ Redis streams          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo folder structure

```
castle-system/
├── apps/
│   ├── client/                 # SPA: Rhizoh, Genesis, Studio, ghost/, rhizoh/
│   ├── gateway/                # REST + WS + Firebase Admin + agent identity
│   ├── worker/                 # Replay, compression batch jobs
│   ├── orchestrator/           # Command routing (@castle/command-dsl)
│   ├── sim-core/               # Deterministic sim harness
│   ├── sfu/                    # WebSocket SFU
│   └── broadcaster/            # Live genesis cue agent (WS consumer)
├── packages/
│   ├── protocol/               # InfraEventEnvelopeV1
│   ├── command-dsl/
│   ├── spatial-events/         # (target) event schemas + bus contracts
│   ├── engine-3d/              # (target) I3DEngine + CesiumAdapter
│   ├── companion-sdk/          # (target) companion types + suggestion queue
│   └── plugin-host/            # (target) sandbox + capability ACL
├── functions/                  # Firebase Cloud Functions
└── docs/                       # This file + AGENT_IDENTITY_AND_ATTRIBUTION.md
```

**Existing anchors:** `apps/client/src/ghost/` (frozen phases), `rhizoh/runtime/`, `rhizoh/agents/`, `studio/`, `castleFlight/`.

---

## 3. Core TypeScript interfaces (target packages)

See `packages/spatial-events` and `packages/engine-3d` (to be extracted). Summary types:

- `BootValidityToken`, `SealedRuntimeSnapshot` — execution anchor  
- `CastleNode`, `SatelliteNode`, `ShadowContinuityRecord` — nodes  
- `SpatialEventEnvelope`, `EventBus`, `CrossNodeCorrelation` — causal field  
- `I3DEngine`, `ArcSpec`, `CameraState`, `TerrainDistortionSpec` — visualization  
- `InteractionState`, `GestureEvent` — interaction  
- `CompanionAgent`, `CompanionSuggestion` — AI (executive: false)  
- `InfraEventEnvelopeV1`, `SyncReconciliation` — sync  
- `PluginManifest`, `PluginHost` — plugins  

Full interface block: implement in `packages/spatial-events/src/index.ts` when package is created (mirror prior architecture review).

---

## 4. Data flow

**Epistemic (§0):** `EXTERNAL → REAL → DERIVED → NARRATIVE` (X→B→C→D) after gateway validation.  
**Execution (frozen):** table below — never upstream into seal.

| Step | Layer | Path |
|------|-------|------|
| Lab AI / plugin | X→B | Gateway validate → append `InfraEventEnvelopeV1` |
| User gesture | B→C | Interaction FSM → observer append (non-executive) |
| Multi-node | C | `crossNodeCausalResonanceV0` + `temporalInterferenceLayerV0` |
| Server ingest | X→B | Gateway POST → Redis stream |
| Viz | D | Cesium arcs / fog — render C, never author C |
| AI | D | Derived snapshot → policy → `CompanionSuggestion` |
| Seal | EXEC | `bootValidityToken` / `mayRehydrate` only |

**Forbidden:** Event → token; Viz → hydrate; Plugin → execution; **any** D→C,B,X or C→B,X (§0.2); external AI as equal actor.

---

## 5. Deployment

| Tier | Component |
|------|-----------|
| CDN | Firebase Hosting — `apps/client` build |
| Compute | Cloud Run / K8s — `apps/gateway` |
| Realtime | `apps/sfu`, gateway WS (social, WAL peer) |
| Data | Firebase Auth, Firestore, Storage; Redis streams |
| External | Cesium Ion; optional LLM API (analysis-only) |

**CI:** `stabilization:validate-graph`, `validate-membrane-v0`, client vitest, gateway substrate tests.

---

## 6. Extension points

| Extension | Entry | Rule |
|-----------|-------|------|
| 3D engine | `I3DEngine` → `CesiumAdapter` | No Cesium types in event/execution layers |
| AI companion | `packages/companion-sdk` | `executive: false`, no `mayRehydrate` |
| Plugins | `packages/plugin-host` | `events:read` only; deny execution writes |
| Event kinds | `spatial-events/registry` + `ci:schema-lock` | Versioned schemas |

---

## 7. Security + isolation

| Zone | Trust | Writable by |
|------|-------|-------------|
| T0 Execution | Highest | Seal pipeline only |
| T1 Gateway | High | Authenticated command-dsl |
| T2 Event log | Append-only | Gateway + validated clients |
| T3 Firestore projections | Medium | Rules + LWW on denormalized docs |
| T4 Viz / UI / AI / Plugins | Low | Never T0 |

**Entanglement (C):** blocked — `multiObserverEntanglementGuardV0`, `entanglementCouplingAllowed: false`.

---

## 8. Agent inventory (complete system map)

Agents are grouped by **authority class**. Only **Execution Core** may change sealed runtime state. All others are observation, interpretation, suggestion, or process metadata.

### 8.1 Authority legend

| Class | Code | May influence execution? | May write `bootValidityToken`? |
|-------|------|--------------------------|----------------------------------|
| Execution | `EXEC` | Yes (frozen core only) | Yes (seal pipeline) |
| Gateway command | `GW-CMD` | Via approved commands only | No (unless seal service) |
| Companion / Mind | `COMP` | No — suggestion & studio causal only | No |
| Causal / Event | `CAUSAL` | No | No |
| Process / Meta | `META` | No — docs, PR, habitat | No |

---

### 8.2 Process & meta agents (coordination, not runtime)

Documented in [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md).

| Agent ID | Class | Role | Persistence |
|----------|-------|------|-------------|
| `Principal (human)` | META | Orchestrator, merge, architectural veto | Git author |
| `Cursor Agent (Castle)` | META | IDE coding agent; habitat rules | Co-authored-by / PR / SESSION_LOG |
| `ChatGPT / Nisa channel` | META | External dialogue — ideas, copy | PR/issue summary |
| `External LLM` | META | Third-party model output | Source + human review |

> *Agents may influence interpretation, never execution.*

---

### 8.3 Rhizoh company agents (governance contracts)

**Source:** `apps/client/src/kernel/company/agentContractsRuntime.js`  
**Spec:** [`RHIZOH_AGENT_OPERATING_CONTRACTS_V1.md`](RHIZOH_AGENT_OPERATING_CONTRACTS_V1.md)

| Agent ID | Class | Mission (summary) | Human approval for |
|----------|-------|-------------------|---------------------|
| `RHIZOH_RESEARCH_AGENT` | GW-CMD | Standards, competitors, research memos | Public external claims |
| `RHIZOH_PRODUCT_AGENT` | GW-CMD | SKU, docs, API content | Release notes, pricing |
| `RHIZOH_PROOF_AGENT` | GW-CMD | Runtime truth, proof reports | Critical red flags |
| `RHIZOH_IP_AGENT` | GW-CMD | Prior art, claim trees | Counsel-bound filings |
| `RHIZOH_GTM_AGENT` | GW-CMD | Lighthouse, outreach drafts | Outbound send |
| `RHIZOH_FUNDING_AGENT` | GW-CMD | Grant queue, drafts | Official submissions |
| `RHIZOH_GOVERNANCE_AGENT` | GW-CMD | Agent-of-agents; kill switch | Domain freeze, policy |

Each contract carries: `permissions`, `budget`, `tools`, `memory`, `proof_requirement`, `kill_switch`.

---

### 8.4 Gateway-persisted agent identities

**Source:** `apps/gateway/src/agentIdentityStore.js`  
**Store:** Firestore `castle_agent_identity` (or local dev store)

| Field | Meaning |
|-------|---------|
| `agentId` | Stable agent document id |
| `ownerUid` | Firebase user owner |
| `role` | Default `AGENT_STUDENT` |
| `personaSeed` | Initial persona blob |
| `capabilityLevel` | Numeric capability tier |
| `progress` | Bumped via `bumpAgentProgress` (academy events) |

Used for academy / progression — **not** execution core identity.

---

### 8.5 Rhizoh chat personas (runtime routing)

**Source:** `apps/client/src/rhizoh/social/socialRuntime/personaRouterV0.js`, `hitabetEngineV0.js`

| Persona ID | Class | When selected |
|------------|-------|---------------|
| `RHIZOH_CORE` | COMP | Default conversational mode |
| `RHIZOH_HOST` | COMP | Host / broadcast register |
| `RHIZOH_INTERPRETER` | COMP | Interpretation-heavy context |
| `RHIZOH_SOCIAL` | COMP | Social room / multi-user |
| `RHIZOH_QUIET` | COMP | Low-initiative / silence bias |
| `RHIZOH-PRIME` | COMP | Gateway long-chat validation context ([`RHIZOH_LONG_CHAT_VALIDATION.md`](RHIZOH_LONG_CHAT_VALIDATION.md)) |

Personas affect **tone, initiative cap, tempo** — not seal or `mayRehydrate`.

---

### 8.6 Studio RSK minds (user-defined companions)

**Source:** `apps/client/src/studio/store/registrySlice.ts`, `studio/types/rskOntology.ts`  
**Runtime:** `studio/runtime/agentRuntimeLoop.ts`, `agentBridge.ts`, `rhizohTurnRunner.ts`

| Concept | Description |
|---------|-------------|
| `MindDefinition` | Immutable template (engine, DNA, capabilities) |
| `MindInstance` | Spawned runtime instance with lifecycle |
| `GhostProfile` | Links soul + optional mind UIDs + `GhostDNA` |
| `MindLink` | Entity ↔ mind binding with authority/sync/bond |
| `AgentProjection` | In-world companion projection (viewport) |

**`SocietyMindRole` (cast specialization):**

| Role | Typical use |
|------|-------------|
| `principal` | Room / castle owner intelligence |
| `observer` | Read-heavy presence |
| `curator` | Content / memory curation |
| `trader` | Economy-facing |
| `moderator` | Room policy |
| `guide` | Navigation / explanation |
| `companion` | Social companion |
| `builder` | Creation / forge |
| `historian` | World-memory keeper |

**`CompanionAgentArchetype`:** `"rhizoh"` \| `"atlas"` \| `"ghost"` — registry: `apps/client/src/studio/runtime/companionAgentRegistryV1.ts`.

| Archetype | Invoke | Stable UID prefix | Default state |
|-----------|--------|-------------------|---------------|
| `rhizoh` | `@Rhizoh` / uid contains `rhizoh` | `rhizoh:companion:{avatar}` | `orbiting` |
| `atlas` | `@Atlas` / uid contains `atlas` | `atlas:companion:{avatar}` | `guiding` |
| `ghost` | `@Ghost` / uid contains `ghost` | `ghost:companion:{avatar}` | `observing` |

All archetypes: `executive: false`, `suggestionOnly: true` (EFIR-α membrane). **Role (§0.6):** semantic interpreter — `input: derived_state` → `output: constrained_narrative_string`; never simulate physics without B trace.

**`RhizohCompanionAgentState`:** `idle` \| `listening` \| `responding` \| `speaking` \| `observing` \| `guiding` \| `orbiting`.

**Causal events:** `companionAgentCausalFactory.ts` — `agent.spawn`, `agent.listen`, etc. (studio graph, not frozen core).

---

### 8.7 Ghost companion stack (embodiment + ecology)

**Source:** `apps/client/src/ghost/`, `rhizoh/social/ecology/`

| Component | Path | Role |
|-----------|------|------|
| Ghost companion state | `ghost/ghostCompanionState.js` | Lineage, dream fossils, memory (`citySpiritId` default `istanbul`) |
| Ghost evolution | `ghost/ghostEvolution.js` | Stages (e.g. Hatchling → …) |
| Ghost intent | `ghost/ghostIntentLayerV547.js` | Intent layer (broadcast / live director input) |
| Ghost embodiment | `ghost/ghostEmbodimentBridgeV546.js` | Scene embodiment bridge |
| Ghost ecology | `rhizoh/social/ecology/ghostEcologyV1.js` | Affinity / rivalry / coalition (observatory ring) |
| Cross-agent rhythm | `ghost/crossAgentRhythmSyncV561.js` | Multi-agent rhythm sync (non-executive) |
| Feedback governors | `ghost/feedbackStabilizationGovernorV557.js`, `runtimeFeedbackLoopV556.js` | Reaction stability (ghost plane) |
| Pet ghost | `studio/runtime/petGhostCausalFactory.ts`, `rhizoh/spatial/ghostPet*` | Entity class `ghost_pet` (CSIL) |

**UI:** `rhizoh/observatory/GhostEcologyRing.jsx`, `GreenroomOrbit.jsx`.

Ghost plane is **adjacent to frozen core** — must not import-write execution seal modules (CI freeze boundary).

---

### 8.8 Rhizoh user-agent cognitive stack (perception → intent)

**Source:** `apps/client/src/rhizoh/agents/index.js`

| Module | Export | Function |
|--------|--------|----------|
| `userAgentSkeletonV1` | `USER_AGENT_SKELETON_V1` | User agent scaffold |
| `agentEcologyPerceptionBridge` | `buildUserAgentEcologyPerception` | Ecology → perception pack |
| `reactiveAgentLayerV1` | `computeReactiveAgentLayerV1` | Reactive layer from context |
| `ghostPerceptionCompilerV1` | `compileGhostPerceptionV1` | Ghost perception compile |
| `userAgentGhostProjectionV1` | `buildUserAgentGhostProjectionV1` | User ↔ ghost projection |
| `perceptionArbitrationLayerV1` | `arbitratePerceptionV1` | Frame dominance / prompt stack |
| `arbitrationStabilityGovernorV1` | `runArbitrationStabilityGovernorV1` | Oscillation / decay |
| `intentFeedbackClosureV1` | `buildIntentFeedbackClosureV1` | Intent trace (closure, not execution) |
| `temporalIntentDriftMemoryV1` | drift summaries | Temporal intent drift for prompts |

**Membrane:** `intentFeedbackClosure` names "feedback" but must not close loop into `bootValidityToken` or navigation execution (EFIR-α).

---

### 8.9 Proto-agents (gestation layer)

**Source:** `apps/client/src/rhizoh/social/spawn/protoAgentGestation.js`

| Property | Value |
|----------|-------|
| ID pattern | `proto_{seed}_{timestamp}_{random}` |
| Status | Gestating phantom mass (cap Σ ηm ≤ 12%) |
| Purpose | Shadow forces on social graph — **no clone spawn** |
| Entity class | Via CSIL spawn pipeline |

---

### 8.10 Infrastructure & broadcast agents

| Agent / service | Path | Role |
|-----------------|------|------|
| Genesis broadcaster | `apps/broadcaster/src/agent.js` | WS world consumer; cinematic cue JSON (optional OpenAI) |
| Constitutional narrator | `apps/client/src/broadcast/constitutionalNarrator.js` | Narration from field/world |
| Live director | `apps/client/src/broadcast/liveDirector.js` | Ghost intent + scene direction |

---

### 8.11 Spatial nodes (not agents — correlation participants)

**Source:** `apps/client/src/rhizoh/runtime/sovereign/satelliteNodeRegistryV0.js`

| Node ID | Role |
|---------|------|
| `node:kadikoy_satellite` | Local primary (preset) |
| `node:barcelona_satellite` | Coherence test zone |
| `node:ankara_satellite`, `node:izmir_satellite`, … | **B Real** — dynamic WGS84 onboarding (`dynamicSatelliteNodeSlugV0`) |
| `castle:user:*` | User Castle nodes (Firestore + studio) |

Used by cross-node resonance — **non-executive** registry; constellation arcs are **D Narrative** render of **C** graph over **B** anchors.

---

### 8.12 Presence roles (room ACL, not full agents)

**Source:** `apps/client/src/studio/lib/presenceRoles.ts`

`owner` \| `moderator` \| `speaker` \| `guest` \| `vip` \| `builder` \| `agent` \| `observer`

---

### 8.13 EFIR-α blocked agent coupling (entanglement)

**Source:** `multiObserverEntanglementGuardV0.js`

| Path | Status |
|------|--------|
| Observer telemetry → resonance weight → navigation | **Blocked** |
| `entanglementCouplingAllowed` | Always `false` |

Prevents observation field from generating its own correlation authority (self-conditioning).

---

### 8.14 Agent → layer matrix (quick reference)

| Agent family | §0 layer | Writes execution? | Ingest (B)? |
|--------------|----------|-------------------|-------------|
| Frozen phase v562–v570 | EXEC (seal) | Yes (deterministic core) | No |
| Lab AI / plugins | **X External** | No | Proposals only (gateway) |
| External APIs / WAL / registry | **B Real** | No | Append-only |
| Resonance / compression / latency | **C Derived** | No | No |
| `@Rhizoh` / `@Atlas` / `@Ghost` | **D Narrative** | No | No |
| Company RHIZOH_* | Gateway / governance | Commands only | No |
| Personas RHIZOH_* | D + social | No | No |
| Studio Mind / Ghost | D + studio causal | No (kernel guard) | No |
| Rhizoh agents stack | C→D interpretation | No | No |
| Proto-agents | C shadow (gestation) | No | No |
| Cesium / I3DEngine | **D** render | No | No |
| Cursor / Nisa / External LLM | META | No | No |

---

## 9. Related documents

| Doc | Topic |
|-----|--------|
| [`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md) | Frozen core v562–v570 |
| [`apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md`](../apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md) | EFIR-α, phases 9–23 |
| **This doc §0** | Real / Derived / Narrative upper law + Reality Seal |
| [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) | Production flags, domain map, Guardian sequence, kill switch, T−7 checklist, §7 self-audit loop |
| [`POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md`](POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md) | Drift thresholds, heartbeat schema, LKG / genesis recovery |
| [`EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md`](EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md) | Layer X — schema, signature, firewall, rate limits |
| [`apps/client/docs/GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md`](../apps/client/docs/GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md) | Guardian first anchor ops |
| [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](MANIFESTO_DISTRIBUTION_PACK_V0.1.md) | Outbound manifesto bundle |
| [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md) | Meta agents, attribution |
| [`RHIZOH_AGENT_OPERATING_CONTRACTS_V1.md`](RHIZOH_AGENT_OPERATING_CONTRACTS_V1.md) | Company agent contracts |
| [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) | Multi-observer policy |
| [`AGENTS.md`](../AGENTS.md) | Cursor habitat + this architecture link |

---

## 10. Implementation priority

1. Extract `packages/spatial-events` + `packages/engine-3d` (`I3DEngine`).  
2. Gateway event ingress (Redis streams, idempotent).  
3. Formalize `packages/companion-sdk` — unify Studio Mind + Ghost + persona under suggestion queue.  
4. Plugin host MVP.  
5. Phase 22: geodesic refinement v2 + temporal compression v2 (C remains blocked).

**EFIR-β gate (conceptual):** when does correlation become constraint? Separate manifesto required.
