# Agent & habitat context — Castle / Rhizoh

Bu repo için **kalıcı yürütme bağlamı** Cursor kurallarında tanımlıdır: [`.cursor/rules/frozen-core-habitat.mdc`](.cursor/rules/frozen-core-habitat.mdc). Cursor Agent’ın bu workspace’teki rol özeti: [`docs/CURSOR_AGENT_INTRO.md`](docs/CURSOR_AGENT_INTRO.md).

## Execution bias vs execution engine (ince çizgi)

| Katman | Rol |
|--------|-----|
| **Execution engine** | Derlenen / çalışan kod: özellikle **v562–v570** frozen subgraph + gerçek runtime |
| **Soft execution policy / bias** | `.cursor/rules`, bu dosya, habitat dokümanları — **ajan ve insanın neye öncelik vereceğini** ve hangi dosyalara dokunulacağını şekillendirir; **motor değildir**, CI graf doğrulayıcısının yerini almaz |

**Tek cümle (koordinasyon):** Frozen core üzerinde **multi-habitat epistemik işbirliği** — aynı kod tabanında **bağlama göre düşünme modları**, çekirdek sabit.

**Çoklu gözlemci (execution değil):** [`docs/OBSERVATION_FABRIC_V1.md`](docs/OBSERVATION_FABRIC_V1.md) — *Agents may influence interpretation, never execution.*

**Katman genişlemesi (core’u yeniden tanımlamadan):** [`docs/LAYER_EXPANSION_PROTOCOL.md`](docs/LAYER_EXPANSION_PROTOCOL.md)

**Kimlik / mühür / attribution:** [`docs/AGENT_IDENTITY_AND_ATTRIBUTION.md`](docs/AGENT_IDENTITY_AND_ATTRIBUTION.md)

**Laboratuvar evren snapshot’ı (replay/diff):** [`docs/WORLDSTATE_V0_SPEC.md`](docs/WORLDSTATE_V0_SPEC.md) · [`docs/schemas/worldstate-v0.schema.json`](docs/schemas/worldstate-v0.schema.json)

## Özet

| Katman | Ne |
|--------|-----|
| **Executable** | v562–v570 frozen faz zinciri + DAG/hash doğrulama |
| **Spec / policy** | `STABILIZATION.md`, `SPECFLOW_MARKERS.md`, ilgili CI scriptleri |
| **Epistemik alt hat** | v567–v570 deterministik güven / drift / anlambilim |
| **Habitat** | Sprint bazlı çalışma modu — dokümanda sabit |

## External briefing (governance — ilk temas)

[`docs/outreach/EDA_EXTERNAL_BRIEFING_V1.0/`](docs/outreach/EDA_EXTERNAL_BRIEFING_V1.0/) — İnsan okunur paket (pitch değil: research / controlled experiment). Repo, secret, internal yok.

## Current operating mode (Phase gate)

[`RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md`](docs/RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md) — **ops snapshot** (phase 0.5, hosting domains, blockers, next transition).

[`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](docs/RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) — **Not a running system:** activation-controlled control-plane spec + frozen perception shell. **A freeze** + **B readiness** (may it run?); signal switch forbidden until READY. **C** = spec only, no new design.

| Track | Status |
|-------|--------|
| Perception / UI framing | ✔ frozen (regression-only) |
| Activation | ⏳ checklist + MANUAL + READY/HOLD |
| Data-plane | ❌ off until signed READY |

## Perception engineering (reference — frozen)

[`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](docs/RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md) — leakage SSOT. Polish/mapping: regression-only; no new L-layers.

## World mesh (UX framing — not single-city demo)

[`docs/RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md`](docs/RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md) — **originless world mesh**; Istanbul = bootstrap observation window (not center). User = node initiator on shared topology.

## Simulation profiles (research-only — NOT production users)

| Name in docs | What it is | What it is NOT |
|--------------|------------|----------------|
| Nisa · Eren · Ceyda · Karden | **Simulation / outreach / runbook anchors** | Runtime agents, WAL writers, production HUD personas |

- **Must not** appear in production ingress UI as “live entities.”
- Friend flows: [`FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md`](apps/client/docs/FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md) — **research / private outreach**, not global product identity.
- Go-live named steps in old protocol docs = **historical sim narrative**; ops truth = [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md).

## Aktif habitat dokümanları

- **Academic sprint:** [`docs/SPRINT_HABITAT_ACADEMIC.md`](docs/SPRINT_HABITAT_ACADEMIC.md)
- **Ortak öğrenme (founder + Cursor + harici reviewer; sim profiles in docs only):** [`docs/HABITAT_COLLABORATION_ACADEMIC.md`](docs/HABITAT_COLLABORATION_ACADEMIC.md)
- **Oturum günlüğü (karar izi):** [`docs/academic/SESSION_LOG.md`](docs/academic/SESSION_LOG.md)
- **Sprint bootstrap şablonu:** [`docs/SPRINT_BOOTSTRAP_TEMPLATE.md`](docs/SPRINT_BOOTSTRAP_TEMPLATE.md)
- **Bağlam yeniden kurulum (Nisa / Cursor / review):** [`docs/CONTEXT_RECONSTRUCTION_PROMPT.md`](docs/CONTEXT_RECONSTRUCTION_PROMPT.md)
- **3D asset kontratı (semantic-first, üretim öncesi):** [`docs/ASSET_CONTRACT_SPEC.md`](docs/ASSET_CONTRACT_SPEC.md) · [`docs/ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](docs/ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md)
- **Sistem sözlüğü + doğrulanmış repo indeksi (ASGL→DCL, RAW/DERIVED/POLICY):** [`docs/RHIZOH_SYSTEM_GLOSSARY_V1.0.md`](docs/RHIZOH_SYSTEM_GLOSSARY_V1.0.md)

## Mimari özet (post-freeze)

[`docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md`](docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md)

## Honest Baseline (founder constitution — non-executable)

[`docs/RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](docs/RHIZOH_HONEST_BASELINE_CHARTER_V1.md) — frozen core as **launch ramp** (not prison); **LLM = transient motor**, **Rhizoh = continuity protocol**; anchor not escape; trust over power. Culture + protocol identity; maps to EFIR-α §0 and frozen v562–v570.

## Epistemic stack (7 layers — v0.1)

| Layer | Doc |
|-------|-----|
| Charter | [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](docs/RHIZOH_HONEST_BASELINE_CHARTER_V1.md) |
| Protocol | [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md) §0–§9 |
| Interface | Outreach packs (social · first-five · academic) |
| Operational | [`RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](docs/RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) |
| Playbook | [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](docs/RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) |
| Simulation | [`RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md`](docs/RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md) — counterfactual |
| **Formal boundary (0.5 closed)** | [**Constraint closure map**](docs/RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md) · NI2 · T1/TI1′ properties |
| **TLA track (Phase A sketch)** | [`RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md`](docs/RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md) — semantic compression before `.tla` |
| **ROKS v1.0 (ontological freeze)** | [`docs/architecture/rhizoh_spec_v1.md`](docs/architecture/rhizoh_spec_v1.md) — 4-primitive **projection**; not closed world |
| **RCMM v1.1 (4 operators)** | [`docs/architecture/rhizoh_canonical_measurement_map_v1.md`](docs/architecture/rhizoh_canonical_measurement_map_v1.md) — no derived `M_*`; `DERIVED_RUNTIME_ONLY` for scores |
| **Runtime role lock (Phase 2.0)** | [`docs/architecture/rhizoh_runtime_semantic_role_lock_v1.md`](docs/architecture/rhizoh_runtime_semantic_role_lock_v1.md) — compute/project only; never interpret into authority |
| **Epistemic firewall (2.1)** | [`docs/architecture/rhizoh_final_epistemic_firewall_v1.md`](docs/architecture/rhizoh_final_epistemic_firewall_v1.md) — `npm run formal:epistemic-firewall-grep` |
| **Authority graph (2.3)** | [`docs/architecture/rhizoh_authority_graph_audit_v1.md`](docs/architecture/rhizoh_authority_graph_audit_v1.md) — `npm run formal:authority-graph-audit` |
| **Legal ingress freeze** | [`docs/legal/RHIZOH_LEGAL_INGRESS_FREEZE_V1.0.md`](docs/legal/RHIZOH_LEGAL_INGRESS_FREEZE_V1.0.md) — entity: [`RHIZOH_LEGAL_ENTITY_SSOT_V1.0.md`](docs/legal/RHIZOH_LEGAL_ENTITY_SSOT_V1.0.md) |
| **READY/HOLD** | [`docs/ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md`](docs/ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md) |
| **Phase 1 contract (thaw)** | [**O1 constraint spec**](docs/RHIZOH_PHASE1_O1_CONSTRAINT_SPEC_V1.0.md) · [**O1 violation harness**](docs/RHIZOH_O1_VIOLATION_EXECUTION_SPEC_V1.0.md) (`npm run ops:o1-violation-harness`) |
| **Observability** | [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](docs/RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md) — factual `breach_observation_v0` |
| **Synthesis** | [`RHIZOH_BREACH_CORRELATION_SYNTHESIS_V0.1.md`](docs/RHIZOH_BREACH_CORRELATION_SYNTHESIS_V0.1.md) — `correlationId` + `synthesizeBreachCoherence` (interpretation only) |
| **External boundary** | [`RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md`](docs/RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md) — client vs gateway truth (A11) |
| **§7 Tick engine** | [`RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md`](docs/RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md) — unified `runEpistemicTickV0` / `goLiveIntegrity.startLoop` |
| **Tick ledger** | [`RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md`](docs/RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md) — cross-tick graph, divergence, replay export, A9 closure |
| **Stability controller** | [`RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md`](docs/RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md) — graph smoothing, long-term thresholds, A9/A11 suppression, drift risk |
| **Audit bundle (§6 atom)** | [`RHIZOH_EPISTEMIC_AUDIT_BUNDLE_V0.1.md`](docs/RHIZOH_EPISTEMIC_AUDIT_BUNDLE_V0.1.md) — `runEpistemicAuditBundleV0` single correlationId evidence export |
| **Reproducibility** | [`RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md`](docs/RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md) — cross-env bundle fingerprint, gateway latency drift, boundary determinism |
| **Identity continuity** | [`RHIZOH_EPISTEMIC_IDENTITY_CONTINUITY_V0.1.md`](docs/RHIZOH_EPISTEMIC_IDENTITY_CONTINUITY_V0.1.md) — cross-run `epi_id_*`, ledger hash, graph drift, fingerprint evolution |
| **Causality graph** | [`RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md`](docs/RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md) — explicit why-over-time (flags → layers → ticks → identity) |
| **Legal membrane** | [`legal/RHIZOH_LEGAL_PACK_FOR_COUNSEL_V1.0.md`](docs/legal/RHIZOH_LEGAL_PACK_FOR_COUNSEL_V1.0.md) · [`COUNSEL_EMAIL_TEMPLATE_V1.0.md`](docs/legal/COUNSEL_EMAIL_TEMPLATE_V1.0.md) · ToS/KVKK · `ingress_router.js` |
| **v1 architectural state** | [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](docs/RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) — control-plane defined · data-plane absent · causal isolation contract (spec stage) |
| **Legal freeze** | [`LEGAL_FREEZE_SPEC_V1.0.md`](docs/LEGAL_FREEZE_SPEC_V1.0.md) — system evolution barrier (4 locks) |
| **Ingress UI freeze** | [`RHIZOH_INGRESS_UI_FREEZE_V1.0.md`](docs/RHIZOH_INGRESS_UI_FREEZE_V1.0.md) — rhizoh.com copy SSOT |
| **Low-risk ops** | [`RHIZOH_LOW_RISK_ZONE_OPERATIONS_V1.0.md`](docs/RHIZOH_LOW_RISK_ZONE_OPERATIONS_V1.0.md) · `npm run ops:passive-coherence-check` |
| **Activation go/no-go** | [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) · `npm run activation:readiness-check` |
| **Phase evolution** | [`RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md`](docs/RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md) — Phase 0 MODEL today |
| **Phase 1 (spec only)** | [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](docs/RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) — first real signal; not implemented |
| **Closed admission (stress cohort)** | [`RHIZOH_CLOSED_USER_ADMISSION_V0.1.md`](docs/RHIZOH_CLOSED_USER_ADMISSION_V0.1.md) · `closedUserAdmissionEngineV0.js` — role gates, no named invites |
| **Go-live cohort sim** | [`RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md`](docs/RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md) · `npm run legal:go-live-cohort-sim` |
| **Ingress flow (rhizoh.com)** | [`RHIZOH_INGRESS_FLOW_V1.0.md`](docs/RHIZOH_INGRESS_FLOW_V1.0.md) · `RhizohIngressFlow.jsx` |
| **Tech summary (non-legal)** | [`legal/RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md`](docs/legal/RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md) |
| **DNS hardening** | [`INFRASTRUCTURE_DNS_HARDENING_V0.1.md`](docs/INFRASTRUCTURE_DNS_HARDENING_V0.1.md) |
| **Counterfactual graph** | [`RHIZOH_EPISTEMIC_COUNTERFACTUAL_GRAPH_V0.1.md`](docs/RHIZOH_EPISTEMIC_COUNTERFACTUAL_GRAPH_V0.1.md) — what could have caused differently (alternate branches) |

**Red team / auditor lens:** [`docs/RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md`](docs/RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md) — A9 cross-tick via ledger · A11 boundary v0.1.

## Operational constitution (execution law)

[`docs/RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](docs/RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) — **Time / Data / Perception integrity** (immutable graph, WAL+seal as truth, UI = verified projection only); Go-Live §6 as ontological freeze gate; enforcement map (`postGoLiveIntegrityLoopV0`, ontological watchdog, boot validity token). **On violation:** [`docs/RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](docs/RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) — revoke · quarantine · shadow · correction chain. **Stress tests:** [`docs/RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md`](docs/RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md) · `violationSimulationSuiteV0.js` (9 scenarios; no unified bus yet).

## Production architecture + agent inventory

[`docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`](docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md) — full stack (Execution → Causal → Observation), deployment, security membrane, and **complete agent map** (company agents, personas, Studio Minds/Ghosts, proto-agents, gateway identities, meta agents). EFIR-α aligned; entanglement path (C) blocked.
- [Rhizoh Go-Live Activation Protocol V1](docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) — production flag matrix (`VITE_DEBUG=0` + membrane allowlist), `rhizoh.io` routing, sequential Guardian bootstrap, kill switch, T−7 audit checklist, **§7 post-activation integrity loop** (`LIVE_OK` / `DEGRADED` / `QUARANTINE`).
- [Launch Polish Night V1](apps/client/docs/LAUNCH_POLISH_NIGHT_V1.md) — pre-domain media/voice/camera/multilingual/concurrency checklist; `window.__rhizoh.launchPolish.voiceSnapshot()` (no new features).
- [Post-Go-Live Autonomous Stability Contract V1](docs/POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md) — drift thresholds, guardian heartbeat schema, quarantine rules, LKG vs genesis recovery states.
- [External Lab AI Integration Spec V1](docs/EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md) — layer X untrusted producers: schema allowlist, HMAC signature, gateway firewall, rate limits (not epistemic equal actors).
- **Narrative provenance (§0.10):** `apps/client/src/rhizoh/runtime/narrativeSourceProvenanceV0.js` — every D-layer output carries `source_chain`, `trust_class`, `derivation_depth` (anti semantic-trust-creep).

- **Guardian first anchor (live):** [`apps/client/docs/GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md`](apps/client/docs/GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md) — staging env + console denetim protocol.
- **Manifesto distribution pack:** [`docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md) — §0–§9 alignment checksum (Honest Baseline → Anti-Manipulation); spine **Observation ≠ Execution**; appendices for outbound channels.
- **Friends (no-code, sim profiles):** [`apps/client/docs/FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md`](apps/client/docs/FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md) — research onboarding ritual, not production agent roster.
- **Captain backstage:** [`docs/CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md`](docs/CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md) — denetim when “Bitti Kaptan!”
- **Outreach (Interface layer):** [`OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md`](docs/OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md) · [`OUTREACH_FIRST_FIVE_SOVEREIGN_NODES_V0.1.md`](docs/OUTREACH_FIRST_FIVE_SOVEREIGN_NODES_V0.1.md) (nodes = WGS84 anchors, not lore) · [`OUTREACH_ACADEMIC_PAPER_PACK_V0.1.md`](docs/OUTREACH_ACADEMIC_PAPER_PACK_V0.1.md) (highest drift risk — jargon/metaphor block; EFIR ≠ slogan) — under Charter + [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](docs/MANIFESTO_DISTRIBUTION_PACK_V0.1.md)

## Related Operational Guides

- **CI drift pack:** `npm run stabilization:validate-canonical-drift` — semantic UI dual-write token, Rhizoh doc canonical links (3 files), `runtimeSnapshot.v1` top-level key lock + shared parse, freeze↔identity import boundary (bundles `validateFreezeIdentityBoundary.mjs`). After changing snap top-level keys: `npm run stabilization:snapshot-v1-top-level-lock:sync`. Lighter inner loop (schema + drift + world→UI membrane): `npm run stabilization:validate-client-boundaries-quick` (includes `stabilization:validate-membrane-v0`). Standalone membrane scan: `npm run stabilization:validate-membrane-v0` — [`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](docs/MEMBRANE_INTEGRITY_PASS_V0.md).
- [Cursor Team Onboarding](docs/CURSOR_TEAM_ONBOARDING_CHECKLIST.md) — reference-layer, non-authoritative
- [Rhizoh living world & embodiment roadmap](docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md) — seed viewport + world state; `RESEARCH-ONLY` (V0)
- [World mesh mental model](docs/RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md) — multi-node framing, Istanbul not center
- [Rhizoh SGRA operational map](docs/RHIZOH_SGRA_OPERATIONAL_MAP_V0.md) — where to decide what (Spec / CI guards / Runtime / agent-ops rhythm); decision-routing clarity (V0)
- [Rhizoh replay contract — continuity equivalence](docs/RHIZOH_REPLAY_CONTRACT_V0.md) — stream vs checkpoint vs replay-equivalence skeleton; `RESEARCH-ONLY` (V0)
- [Rhizoh containment field — temporal epistemic classifier](docs/RHIZOH_CONTAINMENT_FIELD_V0_1.md) — seq-space containment, multi-node readiness; `RESEARCH-ONLY` (V0.1)
- [Rhizoh freeze · identity · snapshot (canonical)](docs/RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md) — Post-SSOT: freeze↔runtime boundary, gateway `connectionId` ownership, snapshot epistemics (V0)
- [Rhizoh session identity inventory](docs/RHIZOH_SESSION_IDENTITY_INVENTORY_V0.md) — `traceId` / continuity / `connectionId` / `sessionId` binding map (V0)
- [Rhizoh SSOT selection policy](docs/RHIZOH_SSOT_SELECTION_POLICY_V0.md) — primary anchor by concern; conflict triggers; deterministic vs heuristic merge (V0, not an engine)
- [Rhizoh runtime identity resolution flow](docs/RHIZOH_RUNTIME_IDENTITY_RESOLUTION_FLOW_V0.md) — voice/text → session + continuity + gateway trace merge points (V0)
- [Studio Firebase integration stabilization](docs/RHIZOH_STUDIO_FIREBASE_INTEGRATION_STABILIZATION_V0.md) — IAL, canonical write model, FER-1 envelope, debug checklist (V0)
- [Firestore rules vs studio envelope audit](docs/FIRESTORE_RULES_VS_STUDIO_ENVELOPE_AUDIT_V0.md) — required fields, reject codes, React minify note (V0)
- [Sovereign Network Kernel Spec v0](docs/SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) — L0/L1/L2 planes, C2C as state propagation, event bus + permission-first posture (`RESEARCH-ONLY`)
- [Sovereign Network contract schemas — PR-2](docs/SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md) — frozen envelope + graph + permission JSON Schema (`schemaVersion` 0)
- [Live runtime & experience phase v0](docs/LIVE_RUNTIME_EXPERIENCE_PHASE_V0.md) — freeze as floor; prioritize streaming, embodiment, perception (`RESEARCH-ONLY` focus note)
- [Live runtime streaming core v0](docs/LIVE_RUNTIME_STREAMING_CORE_V0.md) — worldPresence → orchestrator → Cesium / Castle presence wire map (`RESEARCH-ONLY`)
- [Perceptual stability layer v0](docs/PERCEPTUAL_STABILITY_LAYER_V0.md) — jitter, smoothness, frame–perception, Cesium human-stable feel (`RESEARCH-ONLY`)
- [Cognitive load layer v0](docs/COGNITIVE_LOAD_LAYER_V0.md) — disclosure, visibility schedule, perception budget (`RESEARCH-ONLY`)
- [Surface reduction pass (live) v0](docs/SURFACE_REDUCTION_PASS_LIVE_V0.md) — prod hides debug overlays / demo shortcuts; engine kept (`RESEARCH-ONLY`)
