# Rhizoh repo, live surface, agents, API/model inventory, and vision gap report v0.1

Date: 2026-06-10  
SPECFLOW: RESEARCH-ONLY  
Runtime authority: none. This document is an evidence map; it does not change frozen core, ingress, data-plane, or production behavior.

## 0. Executive summary

This repository already contains a large Rhizoh/Castle system surface: a production client shell, Rhizoh ingress/legal flow, Firebase hosting/functions, a Render-style gateway, LLM provider routing, Ghost/companion/studio layers, real-time presence, Genesis/SSE observability, Cesium/spatial shell code, and many governance/activation documents.

The strongest repo-backed conclusion is:

> Rhizoh is currently best described as a Phase 0.5 control-plane plus frozen perception shell, with live/static ingress and several working runtime surfaces, but with the authoritative data-plane and full Intent Atlas/Spatial Memory vision still gated, research-only, or spec-only.

So the missing piece is not "a better 3D engine". The repo evidence supports the framing that the real gap is the bridge between:

- the cognitive core: intent, memory, trust, Ghost/agent interpretation, continuity, epistemic audit;
- the physical-world representation: coordinates, presence, beacons, Cesium/world shell, external live feeds;
- the activation boundary: legal readiness, READY/HOLD, data-plane switch, causal isolation.

Cesium and AWS are present as important future multipliers, but the repo does not support presenting them as the current center of the live product. The current priority implied by the code and docs is closer to:

1. prove continuity, intent, memory, consent, and hallucination visibility;
2. run first controlled users/cohorts inside the legal/activation boundary;
3. measure real use of Anchor/Beacon/Ghost/Atlas concepts;
4. then scale spatial infrastructure with Cesium/AWS as an amplifier.

## 1. Scope and evidence boundary

This report uses only repository evidence. It does not verify live Firebase console state, DNS dashboards, Render environment values, or real production secrets.

Secret handling rule:

- API key values are not listed.
- Only environment variable names, provider names, and code paths are listed.
- Any client-side `VITE_*` key/token should be treated as build-exposed unless proxied or otherwise protected.

Primary evidence families:

- Repo rules and architecture: `AGENTS.md`, `.cursor/rules/frozen-core-habitat.mdc`, `STABILIZATION.md`, `STABILIZATION_GRAPH.md`, `docs/ARCHITECTURE_POST_FREEZE_SUMMARY.md`
- Phase/ops truth: `docs/RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md`, `docs/RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`, `docs/RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`, `docs/ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md`, `docs/exports/ops/activation_readiness_v1.0.json`
- Client/live surface: `apps/client/src/main.jsx`, `apps/client/src/boot/mountCastleApplicationV0.jsx`, `apps/client/src/shell/CastleShellRouter.jsx`, `apps/client/src/AppRhizoh528.jsx`, `apps/client/src/AppRhizoh528T0.jsx`, `apps/client/src/rhizoh/ingress/*`
- Gateway/API surface: `apps/gateway/src/server.js`, `apps/gateway/src/rhizohLlmGateway.js`, `apps/gateway/src/rhizohGatewayTurn.js`, `apps/gateway/src/rhizohProductionBootstrap.js`
- Hosting/proxy: `firebase.json`, `functions/index.js`, `apps/client/src/castleFlight/castleFlightConfig.js`
- Agents/entities: `apps/client/src/ghost/*`, `apps/client/src/rhizoh/agents/*`, `apps/client/src/studio/runtime/*`, `docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`

## 2. What is in the repo

| Area | Current repo contents | Runtime status |
| --- | --- | --- |
| Frozen epistemic core | v562-v570 Ghost/phase modules, graph/hash validation, canonical drift guards | Frozen; behavior/topology changes require stabilization graph and lock updates |
| Rhizoh web client | Vite/React client, T0 shell, ingress, legal preamble, Firebase auth, map/presence, voice, Studio surfaces | Implemented browser surface |
| Rhizoh.com ingress | Legal/language/cohort/hold/app flow; rhizoh.com hostname checks; static legal docs | Implemented, frozen/regression-only surface |
| Firebase hosting/functions | Hosting rewrites, same-origin gateway proxy, cohort gate function | Implemented deployment/proxy layer |
| Gateway | LLM routing, voice transcription, memory, Genesis/SSE, health, live feed, ops endpoints | Implemented server surface; production activation/auth depends on env and gates |
| LLM provider layer | OpenAI, Anthropic, Gemini, xAI, DeepSeek, Mistral, OpenRouter routing | Implemented in gateway |
| Ghost/companion/studio | Ghost state/evolution, companion registry, Studio mind loop, presence mesh, observer species | Implemented in parts; execution authority constrained |
| Real-time presence/map | Firestore active castles, presence bus, world observability globals, optional Cesium/world route | Implemented in parts; prod spatial layer is env-gated |
| Intent Atlas | UI Intent Atlas doc plus V0 trace slice for gateway retry | Mostly research/spec; not a full product graph engine |
| Spatial Memory | Memory Anchor docs, geo/memory consent modules, local beacon prototypes | Research-only/prototype; not a distributed authoritative memory geography |
| Consent/legal | ToS/KVKK/AI consent docs, legal preamble, checkboxes, legal freeze docs | Implemented ingress surface; legal thaw/READY remains manual |
| AWS substrate | Constitutional substrate phase docs | Reference/non-executable |
| Cesium | Executor spec/code, optional world shell, Cesium asset/build guard | Code exists; not the default proof of core value |
| Dream Layer | Ghost dream-fossil concepts and archive artifacts | No independent canonical "Dream Layer" runtime layer found |

## 3. How rhizoh.com appears to work from repo evidence

### 3.1 Boot path

The default browser path is:

```text
apps/client/index.html
  -> apps/client/src/main.jsx
  -> initRuntimeFrameOnce
  -> mountCastleApplicationV0
  -> RhizohIngressFlow or CastleShellRouter
  -> AppRhizoh528
  -> AppRhizoh528T0
```

Important files:

- `apps/client/src/main.jsx`
- `apps/client/src/boot/mountCastleApplicationV0.jsx`
- `apps/client/src/rhizoh/ingress/RhizohIngressFlow.jsx`
- `apps/client/src/rhizoh/ingress/ingress_router.js`
- `apps/client/src/shell/CastleShellRouter.jsx`
- `apps/client/src/AppRhizoh528.jsx`
- `apps/client/src/AppRhizoh528T0.jsx`

### 3.2 Hosting and domain model

`firebase.json` shows Firebase Hosting for site `castle-genesis`, output directory `apps/client/dist`, and rewrites:

- `/api/cohortGateV0` -> Firebase function `cohortGateV0`
- `/api/gatewayProxy/**` -> Firebase function `gatewayProxyV0`
- all other paths -> `/index.html`

Repo docs describe:

- `castle-genesis.web.app` / `castle-genesis.firebaseapp.com` as default Firebase hosts;
- `castle-genesis.com` / `app.castle-genesis.com` as connected custom domains;
- `www.rhizoh.com` as Rhizoh ingress/legal target;
- `rhizoh.com` as redirect/holding behavior depending on DNS/ops setup.

Key docs:

- `docs/RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md`
- `docs/INFRASTRUCTURE_DNS_HARDENING_V0.1.md`
- `apps/client/docs/DEPLOY_MATRIX_V1.0.md`

### 3.3 Ingress flow

The ingress flow is implemented as:

```text
LANGUAGE -> LEGAL_PREAMBLE -> COHORT -> HOLD/APP/ERROR
```

Main files:

- `apps/client/src/rhizoh/ingress/RhizohIngressFlow.jsx`
- `apps/client/src/rhizoh/ingress/ingress_router.js`
- `apps/client/src/rhizoh/ingress/ingressCopyI18nV0.js`
- `apps/client/src/rhizoh/ingress/legalEntityConstantsV0.js`

Legal preamble is required on `rhizoh.com`, `www.rhizoh.com`, subdomains, or when relevant env flags force it.

Important nuance: the cohort step in the ingress path is intentionally limited/no-op in some flows. It should not be described as a fully activated admission engine unless the backing gate and readiness state are verified.

### 3.4 Gateway proxy path on rhizoh.com

For rhizoh.com-style hosts, the browser prefers same-origin HTTP/SSE proxying:

```text
Browser
  -> https://www.rhizoh.com/api/gatewayProxy/...
  -> Firebase Function gatewayProxyV0
  -> upstream gateway, e.g. Render-hosted Rhizoh gateway
```

Relevant files:

- `apps/client/src/castleFlight/castleFlightConfig.js`
- `functions/index.js`
- `firebase.json`

WebSocket is different: Firebase function proxy is fetch/HTTP oriented, so WebSocket paths are configured to use the direct gateway WSS path rather than the same-origin Firebase proxy.

### 3.5 Data-plane status

Repo phase docs repeatedly separate deployment from activation:

- production surface: active/static ingress + frozen shell;
- activation: deferred/manual READY/HOLD;
- data-plane: off/inert until signed readiness;
- Phase 1 real signal: spec-only, not implemented as live ingest.

Key files:

- `docs/RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`
- `docs/RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`
- `docs/RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`
- `apps/client/src/rhizoh/ingress/phase1ActivationGateV0.js`

Safe wording:

> rhizoh.com can host the ingress and frozen perception shell; this is not the same as saying the authoritative Rhizoh data-plane is live.

## 4. Runtime elements and entity taxonomy

The user-facing word "agent/entity" should not be collapsed into one population. Repo evidence supports at least these categories:

| Category | Meaning | Examples in repo | Cost profile |
| --- | --- | --- | --- |
| Active Agent Entity | Model-backed or loop-backed reasoning actor | LLM gateway turns, Studio mind loop, broadcaster optional OpenAI | High: tokens, latency, orchestration, API limits |
| Ghost Entity | User-linked semi-persistent interpretive/companion state | `apps/client/src/ghost/*`, Ghost ecology, ghost companion state | Medium: event-driven, stateful, mostly client/runtime logic |
| Memory Entity | Anchor/Beacon/profile/context nodes | memory endpoints, anchor docs, local spatial memory modules | Low to medium: storage/query/traversal cost |
| Intent Entity | Short-lived or traceable intent/action node | UI intent trace, gateway retry trace, future Intent Atlas | Medium: graph density and causality cost |
| Observer Entity | Perception/visual/species anchor, not executive | Fox/Octo observer species, presence surfaces | Low to medium: render/perception state |
| Governance/Spec Agent | Documented role or policy actor, not runtime execution | company agent contracts, PAG/Council docs, Cursor/Nisa/external LLM docs | No direct runtime cost unless implemented elsewhere |

This distinction matters because system capacity is not "how many nodes exist"; it is closer to active cognitive load:

```text
System load =
  active LLM/agent reasoning
  + realtime event fan-out
  + graph traversal depth
  + memory retrieval latency
  + client rendering complexity
```

## 5. Agent and model inventory

### 5.1 Implemented LLM path

Main path:

```text
client rhizohQueryLlmV1
  -> POST /rhizoh/llm
  -> rhizohGatewayTurn
  -> rhizohLlmGateway
  -> selected provider/model
```

Files:

- `apps/client/src/rhizoh/runtime/rhizohQueryLlmV1.js`
- `apps/gateway/src/rhizohGatewayTurn.js`
- `apps/gateway/src/rhizohLlmGateway.js`
- `apps/gateway/src/rhizohBrain.js`
- `apps/gateway/src/llmConnectionsStore.js`

Provider defaults from gateway code:

| Provider | Env key | Default model |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` |
| Anthropic | `ANTHROPIC_API_KEY` | `claude-3-5-sonnet-latest` |
| Gemini | `GOOGLE_API_KEY` or `GEMINI_API_KEY` | `gemini-2.0-flash` |
| xAI | `XAI_API_KEY` | `grok-2-1212` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek-chat` |
| Mistral | `MISTRAL_API_KEY` | `mistral-small-latest` |
| OpenRouter | `OPENROUTER_API_KEY` | `openai/gpt-4o-mini` |

Selection/control env names:

- `CASTLE_LLM_PROVIDER`
- `CASTLE_LLM_MODEL`
- `CASTLE_LLM_MAX_TOKENS_CAP`
- `CASTLE_LLM_REQUIRE_EXPLICIT_KEY_SOURCE`
- `CASTLE_RHIZOH_LLM_DIAG`
- `CASTLE_LLM_ACCESS_LOG`

### 5.2 User-owned API key path

Repo contains a BYOK-style path for user LLM connections:

- CRUD/test routes under `/llm/connections`
- encrypted storage through `apps/gateway/src/llmConnectionsStore.js`
- connection selection through gateway turn logic

Key env names:

- `CASTLE_STORE_SECRET` for encryption at rest
- `CASTLE_REQUIRE_FIREBASE_PERSIST` for persistence expectations
- Firebase Admin env names listed below

Risk note: if user key storage is enabled, the production posture depends heavily on `CASTLE_STORE_SECRET`, Firebase/Admin setup, auth enforcement, and logs never echoing raw keys.

### 5.3 Companion/Studio agents

Implemented companion archetypes are visible in:

- `apps/client/src/studio/runtime/companionAgentRegistryV1.ts`
- `apps/client/src/studio/runtime/agentRuntimeLoop.ts`
- `apps/client/src/studio/runtime/agentBridge.ts`
- `apps/client/src/studio/runtime/companionAgentCausalFactory.ts`
- `apps/client/src/studio/store/rhizohCompanionSlice.ts`

Important archetypes:

| Archetype | UID pattern | Authority |
| --- | --- | --- |
| `rhizoh` | `rhizoh:companion:{avatar}` | Companion/interpreter; not executive authority |
| `atlas` | `atlas:companion:{avatar}` | Companion/atlas-facing; not full Intent Atlas runtime |
| `ghost` | `ghost:companion:{avatar}` | Ghost-facing companion; non-executive |

The key safety point is that Studio/companion agents are not equivalent to an autonomous production council with execution authority.

### 5.4 Ghost stack

Important files:

- `apps/client/src/ghost/ghostCompanionState.js`
- `apps/client/src/ghost/ghostEvolution.js`
- `apps/client/src/ghost/ghostIntentLayerV547.js`
- `apps/client/src/ghost/ghostEmbodimentBridgeV546.js`
- `apps/client/src/ghost/ghostMemory.js`
- `apps/client/src/ghost/ghostNarrator.js`
- `apps/client/src/ghost/crossAgentRhythmSyncV561.js`
- frozen v562-v570 phase modules under `apps/client/src/ghost/phase*.js`

Frozen boundary:

- v562-v570 topology/behavior is part of the locked stabilization graph.
- Runtime changes here are not a normal product-edit surface.
- New work should be v571+, experimental, docs, or non-invasive unless explicitly doing a stabilization graph change.

### 5.5 Client cognitive/agent boundary

Important files:

- `apps/client/src/rhizoh/agents/index.js`
- `apps/client/src/rhizoh/agents/userAgentSkeletonV1.js`
- `apps/client/src/rhizoh/agents/reactiveAgentLayerV1.js`
- `apps/client/src/rhizoh/agents/ghostPerceptionCompilerV1.js`
- `apps/client/src/rhizoh/agents/perceptionArbitrationLayerV1.js`
- `apps/client/src/rhizoh/runtime/rhizohAgentCognitionBoundaryV0.js`

These modules support perception, arbitration, intent feedback, and drift memory patterns; they should not be marketed as "truth engine" behavior.

### 5.6 Observer species and visual anchors

Implemented observer/anchor species:

- `octo_v1` -> `/models/octo-blue-ringed.glb`
- `fox_v1` -> `/models/fox1.glb`

Files:

- `apps/client/src/studio/observerSpeciesRegistryV0.js`
- `apps/client/src/studio/conversationAnchorSpeciesV0.js`
- `apps/client/src/rhizoh/runtime/RhizohPresenceSurfaceStripV0.jsx`
- `apps/client/src/castleFlight/foxFrameAnchorBindingV0.js`

These are visual/perceptual anchor species, not proof that named live agents are operating in production.

### 5.7 Governance/spec agents

Docs define many agent roles that are governance, attribution, or planning constructs:

- `docs/AGENT_IDENTITY_AND_ATTRIBUTION.md`
- `docs/CURSOR_AGENT_INTRO.md`
- `docs/RHIZOH_AGENT_OPERATING_CONTRACTS_V1.md`
- `docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`
- `apps/client/src/kernel/company/agentContractsRuntime.js`

Company/governance IDs include:

- `RHIZOH_RESEARCH_AGENT`
- `RHIZOH_PRODUCT_AGENT`
- `RHIZOH_PROOF_AGENT`
- `RHIZOH_IP_AGENT`
- `RHIZOH_GTM_AGENT`
- `RHIZOH_FUNDING_AGENT`
- `RHIZOH_GOVERNANCE_AGENT`

These are contract/role surfaces unless separately wired into runtime loops.

### 5.8 Council/Konsey status

The repo contains Council/PAG/governance documents and archived LLM conversation artifacts. The implemented gateway brain may carry `councilEnabled` style metadata, but there is no repo-backed evidence of a separate production Council runtime that cross-validates every answer with Claude Scholar, Atlas Observer, Gemini Visual, etc.

Safe wording:

> Council is a strong governance/architecture direction, and partial metadata/prompt concepts exist, but a fully operational multi-model council should be treated as future/spec unless verified in runtime.

### 5.9 Simulation profiles

Names such as Nisa, Eren, Ceyda, and Karden are documented as simulation/outreach/runbook anchors, not production live users or runtime agents.

Relevant rule:

- `AGENTS.md` says these profiles must not appear in production ingress UI as live entities.

## 6. API, endpoint, and environment inventory

### 6.1 Gateway/security env names

| Env name | Purpose |
| --- | --- |
| `CASTLE_GATEWAY_TOKEN` | Gateway bearer/shared proxy token |
| `CASTLE_EPISTEMIC_SEAL_SECRET` | Epistemic seal signing |
| `CASTLE_REQUIRE_AUTH` | Require auth |
| `CASTLE_ALLOW_DEV_ANON` | Dev anonymous bypass |
| `CASTLE_ALLOW_DEV_HTTP_UID` | Dev UID header bypass |
| `CASTLE_JWT_SECRET` | JWT fallback when Firebase Admin unavailable |
| `CASTLE_STORE_SECRET` | User LLM key storage encryption |
| `CASTLE_ALLOWED_ORIGINS` | CORS allowlist |
| `CASTLE_HTTP_CORS_ORIGIN` | HTTP CORS origin |
| `CASTLE_RL_RHIZOH_LLM_PER_MIN` | LLM rate limit |
| `CASTLE_RL_LLM_CONNECTION_TEST_PER_MIN` | LLM connection test rate limit |

### 6.2 Firebase env names

Gateway/Admin:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CASTLE_REQUIRE_FIREBASE_PERSIST`

Client/Vite:

- `VITE_FIREBASE_CONFIG`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- related Firebase config fields combined by client build config

Functions:

- `COHORT_EMAIL_ALLOWLIST`
- `CASTLE_GATEWAY_TOKEN`
- `CASTLE_GATEWAY_UPSTREAM`

### 6.3 Client-to-gateway env names

| Env name | Purpose |
| --- | --- |
| `VITE_GATEWAY_HTTP` | HTTP gateway base |
| `VITE_RHIZOH_LLM_HTTP` | LLM HTTP base/override |
| `VITE_GATEWAY_WS` | WebSocket gateway |
| `VITE_GATEWAY_WS_URL` | WebSocket gateway URL |
| `VITE_GATEWAY_TOKEN` | Client-baked gateway token |
| `VITE_LIVE_GATEWAY_BASE` | Genesis/SSE/LLM base |
| `VITE_PREFER_LOCAL_GATEWAY` | Prefer local gateway in dev |
| `VITE_CASTLE_GATEWAY_OFF` | Disable gateway path |
| `VITE_RHIZOH_LLM_TOKEN` | Extra LLM token surface |
| `VITE_GATEWAY_URL` | Legacy gateway URL |

Risk note: `VITE_*` values are normally embedded into the browser bundle. They should not be treated as private secrets.

### 6.4 Voice/STT env names

| Env name | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Whisper/accurate transcription path |
| `GOOGLE_SPEECH_API_KEY` | Google Speech path |
| `GOOGLE_API_KEY` | Google/Gemini shared key surface |
| `CASTLE_RL_RHIZOH_VOICE_TRANSCRIBE_PER_MIN` | Voice transcription rate limit |
| `VITE_RHIZOH_VOICE_ENGINE_V3` | Client voice v3 feature flag |

### 6.5 External data/map env names

Server-side/live feeds:

- `NEWSDATA_API_KEY`
- `CASTLE_NEWSDATA_API_KEY`
- `GUARDIAN_API_KEY`
- `CASTLE_GUARDIAN_API_KEY`
- `FOOTBALL_DATA_ORG_TOKEN`
- `API_SPORTS_KEY`
- `CASTLE_NEWS_COUNTRY`
- `CASTLE_NEWS_LANGUAGE`

Client-side map/weather surfaces:

- `VITE_OPENWEATHER_API_KEY`
- `VITE_TOMTOM_API_KEY`
- `VITE_CESIUM_ION_TOKEN`
- `VITE_MAPBOX_TOKEN`

These client-side values should be considered exposed if baked into the client.

### 6.6 Agent containment env names

- `CASTLE_AGENT_MAX_ITERATIONS`
- `CASTLE_AGENT_TURN_TIMEOUT_MS`
- `CASTLE_AGENT_SESSION_TOKEN_CEILING`
- `CASTLE_AGENT_RECURSIVE_TOOL_DEPTH`
- `CASTLE_AGENT_EMERGENCY_DISABLE`
- `CASTLE_AGENT_SNAPSHOT_RING`

### 6.7 Main HTTP/SSE/API endpoints

LLM and voice:

- `POST /rhizoh/llm`
- `POST /rhizoh/voice/transcribe/v3`
- `/llm/connections[...]`
- `POST /llm/connections/test`

Genesis/SSE:

- `GET /rhizoh/genesis/stream`
- `GET /rhizoh/genesis/runtime`
- `GET /rhizoh/genesis/__ping`
- `POST /rhizoh/genesis/ingress`
- checkpoint/replay/continuity routes under Genesis production bootstrap

Epistemic/product:

- `POST /rhizoh/epistemic/seal`
- `POST /rhizoh/epistemic/logs/batch`
- `GET /rhizoh/product/external-truth`
- `POST /rhizoh/product/outcome`
- `GET /rhizoh/product/outcome/aggregate`
- `POST /rhizoh/product/external-loss/batch`

Agents/academy/memory:

- `/agents/identities[...]`
- `/academy/events[...]`
- `/memory[...]`
- `/memory/profile`
- `/memory/context`
- `/memory/compact`

Live feeds:

- `GET /rhizoh/live/world-feed`
- `GET /rhizoh/live/sports-bundle`
- `GET /rhizoh/live/news-headlines`

Firebase Functions public paths:

- `/api/cohortGateV0`
- `/api/gatewayProxy/**`
- `/api/cohortSessionFeedbackMailV0`
- `/api/cohortFeedbackSubmitV0`

Health:

- `/health`
- `/health/live`
- `/health/ready`
- `/health/reality`
- `/health/substrate`

## 7. Vision versus current implementation

### 7.1 Summary table

| Dimension | Vision | Repo/current evidence | Gap |
| --- | --- | --- | --- |
| Rhizoh Core | Deterministic epistemic core, continuity, trust/error semantics | Frozen v562-v570 graph and many validators exist | Core exists but should not be modified casually; product proof must sit around it |
| Live system | Running continuity protocol with controlled real signals | Phase 0.5 surface active; data-plane inert | Deployment is ahead of activation |
| Intent Atlas | Spatial/semantic graph of user intent and paths | V0 trace slice and docs exist | Full Atlas graph/compiler not implemented as core product |
| Spatial Memory | Anchors/beacons tied to memory, consent, location | Docs and local/client prototype modules exist | Authoritative memory geography not yet live |
| Consent Layer | Legal + memory + geo + AI/cross-border consent | Legal ingress exists; memory/geo modules exist | Counsel/manual readiness and product consent UX still need proof |
| Ghost/Companion | Semi-persistent user-linked interpretive entities | Ghost/companion code exists | Need controlled user proof, not just rich architecture |
| Council | Multi-agent cross-check against hallucination | Governance/spec and some prompt metadata | No fully operational multi-model council proven by repo |
| Cesium/world | Accurate globe, coordinate system, digital twin | Cesium code/spec exists; env-gated | Powerful multiplier, not current core proof |
| AWS substrate | Constitutional object/ledger substrate | Reference docs | Not current production substrate in repo evidence |
| Dream Layer | Reflective analysis of traces/dreams | Ghost dream-fossil references only | No standalone canonical Dream Layer runtime |
| Hallucination control | Make uncertainty/source/error visible | Epistemic docs, seal/logging, source/provenance concepts | Need product path from answer -> intent -> source -> feedback |

### 7.2 The real gap

Repo evidence supports this diagnosis:

> The gap is the missing operational bridge between cognitive meaning and spatial/world representation.

The codebase has pieces of both sides:

- cognitive side: LLM gateway, Ghost, companion registry, epistemic seal/logging, frozen trust/error semantics, memory endpoints;
- spatial side: Firestore presence, map/world shell, Cesium executor, spatial memory anchor prototype, geo consent;
- bridge side: Intent Atlas V0 trace and research docs, but not a complete live product graph.

Therefore, a safer product narrative is:

- not "we have a perfect 3D world";
- not "we guarantee truth";
- but "we are building a continuity protocol where AI outputs are tied to intent, memory, location, provenance, and feedback."

### 7.3 Cesium and AWS position

Cesium is valuable because it can give Rhizoh:

- WGS84/global coordinate system;
- terrain/imagery/city-scale digital twin affordances;
- camera/world execution sink;
- future spatial correctness for Anchor/Beacon/Path/Orbit/Ghost.

But repo evidence says Cesium is currently:

- present in code/spec;
- env-gated;
- not the default proof of value for Intent Atlas;
- risky if used as a substitute for proving memory/intent/consent.

AWS is even more future-facing:

- documented as a constitutional substrate/reference layer;
- not the current Firebase/Render-style production deployment center according to repo evidence.

### 7.4 Hallucination stance

Rhizoh should not be described as a truth engine.

Repo-consistent framing:

> Rhizoh can make hallucination visible, attributable, and learnable by attaching AI outputs to intent, source, memory, confidence/provenance, agent identity, and user feedback.

Potential product chain:

```text
AI answer
  -> source/provenance metadata
  -> intent node / trace
  -> memory/spatial context
  -> confidence/error event
  -> user feedback
  -> future dream/reflection/repair analysis
```

This is stronger and more honest than claiming that hallucination is eliminated.

## 8. Risk register

| Risk | Why it matters | Repo-backed mitigation direction |
| --- | --- | --- |
| Premature infrastructure scaling | Cesium/AWS can distract from proving user intent/memory behavior | Prioritize Intent Atlas V0 proof, consent, and first controlled users |
| Deployment/activation confusion | Live domain can be mistaken for live data-plane | Keep "deployment != activation" language in all reports |
| Secret exposure | Client `VITE_*` values are baked into browser bundle | Keep private provider keys server-side; use proxy/rotation |
| Gateway token exposure | `VITE_GATEWAY_TOKEN` is client-visible if used | Treat as access control convenience, not a secret boundary |
| Council overclaim | Docs mention council, runtime proof is limited | Present as governance/spec unless implemented |
| Sim profile confusion | Nisa/Eren/Ceyda/Karden could be misread as real live entities | Keep sim profiles out of production ingress/live user claims |
| Frozen core accidental edits | v562-v570 are graph/hash locked | Avoid runtime edits unless doing full stabilization change set |
| Data-plane false start | Phase 1 switch and heartbeat route are not live | Use activation checklist and READY/HOLD as gate |
| BYOK storage weakness | User API keys depend on encryption/auth/log discipline | Require `CASTLE_STORE_SECRET`, auth, no raw-key logs |
| Product truth claims | LLMs still predict; external world changes | Report confidence/provenance/error as first-class events |

## 9. Recommended near-term proof order

This ordering follows the repo's current state and the user's architectural diagnosis:

1. Intent Atlas V0
   - Make every meaningful answer/action attach to an intent trace.
   - Start with low-risk client/gateway traces before building a full graph compiler.

2. Spatial Memory V0
   - Prove Anchor/Beacon usefulness with explicit consent.
   - Keep it client/local or controlled until data-plane readiness is signed.

3. Consent Layer proof
   - Preserve legal ingress.
   - Add product-level clarity for memory, geo, AI, and cross-border implications before broad use.

4. First controlled users
   - Observe whether users naturally create Anchors, return to Ghosts, and benefit from recall.
   - Measure behavior before scaling infrastructure.

5. Hallucination visibility
   - For every AI output, expose source/provenance/confidence/intent linkage where possible.
   - Treat wrong/uncertain output as an event, not an invisible failure.

6. Cesium transition
   - Use Cesium once spatial correctness becomes a multiplier for observed user behavior.
   - Avoid using the globe as the primary proof before intent/memory are proven.

7. AWS/substrate expansion
   - Move to constitutional substrate only when data durability, scale, and external audit requirements justify it.

## 10. Validation commands

Useful repo commands for this report's domain:

```bash
npm run stabilization:validate-graph
npm run stabilization:validate-specflow
npm run stabilization:validate-canonical-drift
npm run stabilization:validate-client-boundaries-quick
npm run stabilization:validate-membrane-v0
npm run activation:readiness-check
npm run verify:production
npm run validate:rhizoh-smoke
```

Build/deploy surfaces:

```bash
npm run build:rhizoh-production
npm run firebase:deploy:hosting
npm run dev -w apps/client
npm run dev -w apps/gateway
```

## 11. Final one-page answer

What exists today:

- Live/static Rhizoh ingress and frozen perception shell.
- Firebase hosting/functions and gateway proxy.
- Gateway LLM routing to multiple providers.
- Ghost/companion/studio/presence surfaces.
- Real-time map/presence and optional Cesium/world shell.
- Legal/activation/freeze governance.
- A large spec/research body for Intent Atlas, Spatial Memory, world mesh, AWS substrate, and controlled activation.

What does not yet exist as a fully proven live product:

- Authoritative active data-plane.
- Full Intent Atlas graph/compiler.
- Distributed Spatial Memory.
- Fully operational multi-model Council.
- Standalone Dream Layer runtime.
- AWS constitutional substrate in production.
- Cesium as the default proof of product value.

Most accurate current framing:

> Rhizoh is not missing a visual engine; it is missing the completed operational bridge from intent and memory to spatially anchored, consented, provenance-aware world state. The repo already contains many parts of that bridge, but the product proof should come from Intent Atlas, Spatial Memory, Consent, and controlled users before large infrastructure scale-up.
