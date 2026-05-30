# Sovereign Network Kernel — Spec v0

**SPECFLOW:** `RESEARCH-ONLY` — architecture / sequencing contract; **not** an execution engine. Executable truth remains code + stabilization validators + freeze policy.

**Related:** [`docs/ANCHOR_TRUTH_TABLE_V0.md`](ANCHOR_TRUTH_TABLE_V0.md) · [`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](MEMBRANE_INTEGRITY_PASS_V0.md) · [`docs/RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md`](RHIZOH_FREEZE_IDENTITY_SNAPSHOT_SSOT_V0.md) · **PR-2 contract freeze:** [`docs/SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md`](SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md) · client registry hints: `apps/client/src/sovereign/sovereignRuntimeSpec.js` (`SOVEREIGN_API_KEYS`, `FIREBASE_PATH_KEYS`)

---

## 1. Three-plane model (production shape)

| Plane | Role | Examples |
|-------|------|----------|
| **L0 — Identity plane (truth)** | Who owns what; durable authority | Firebase Auth, user profile, `castleId` ownership, profile-bound `homeAnchor` (see anchor truth + primary resolver), subscription entitlement roots |
| **L1 — Epistemic state plane (meaning)** | What the world *means* for a Castle; mutable interpretive state | Atmosphere slice, pet / companion state, memory echoes, studio tier / degraded mode, portal **intent** (signed object refs, not files-on-wire as SSOT) |
| **L2 — Transport plane (network)** | How state moves; no extra “truth” | Firestore / RTDB / WebSocket, presence sync, broadcast topics, chunk delivery |

### Critical framing

**Portal, broadcast, and “pet visit” are not L2 product features.** They are **L1 state and events** *carried by* L2. L2 is the pipe; L1 is the payload semantics; L0 is who may emit or accept.

---

## 2. Home anchor vs “global hub” (Serencebey discipline)

| Correct | Incorrect |
|---------|-----------|
| Default **home anchor** in product narrative (profile-backed) | “World authority” or global truth root |
| **Perception / projection origin** for a given user session (when profile says so) | “All castles’ network root node” |
| **Atmospheric / projection seed** alongside other seeds (calibration vs identity already separated — see anchor truth table) | Conflating map center with `HOME_BASE` |

**Lock sentence:**

- **Serencebey (when chosen as home)** = *perception origin* for that Castle’s projection stack.  
- **Castle Core (L0 + profile chain)** = *truth origin*.  
- **Network** = *distributed peers* with ACL-bound subscriptions — not a single cosmic center.

---

## 3. C2C engineering mapping (three proposals reduced)

### A) Pet visitation → presence projection sync

- **Is:** Shared pet **state** + remote **render** contract + latency-aware animation sync.  
- **Is not:** The pet literally “travelling” as a physical object across servers.

**Model:** Remote Castle’s **authorized L1 snapshot / diff** → your renderer applies **projection** only; no cross-tenant truth write without L0-gated capability.

### B) Atmospheric broadcast → state diff broadcast

- **Is:** Weather / atmosphere **event stream** = **state deltas** on a topic.  
- **Is not:** “Emotion transfer” as authority; emotion-like UI is *derived presentation* from scalars + policy.

**Model:** e.g. home atmosphere change → **event** → **broadcast topic** → subscribers update **local L1 projection** (still subject to ACL + trust).

### C) Data portals → epistemic transfer event

- **Is:** **Event + pointer** (reference to versioned state / doc id / signed payload hash), not “file send” as the core abstraction.  
- **Is:** **Signed event** (see §5) + Firestore (or CF) mediated delivery.  
- **Is not:** Ad-hoc UI-driven “truth merge” on receive (violates membrane: UI renders, does not decide).

---

## 4. Protocol placeholder vs real security posture

Strings like `END_TO_END_EPISTEMIC_ENCRYPTION` are **semantic placeholders** until a concrete crypto design exists.

**V0 engineering priority (permission-first):**

1. **Event signing** — bind `(castleId, userId, eventType, payloadHash, monotonic revision)` where product requires non-repudiation.  
2. **Permission graph** — who may read/write which L1 streams; deny-by-default.  
3. **Subscription ACL** — topic visibility derived from L0 + graph, not from UI selection.  
4. **Event filtering + trust graph** — rate limits, issuer reputation, replay windows.

Encryption-at-rest / in-transit follows platform defaults (TLS, Firebase rules); **application-level E2E** is a later, explicit milestone — not implied by v0 naming.

---

## 5. Network ≠ UI (membrane rule)

| Wrong | Right |
|-------|--------|
| Castle-to-Castle as a **UI feature** | C2C as **state propagation + projection** layer |
| UI chooses remote truth | UI **renders** envelopes / diffs authorized by L0/L1 policy |

Aligns with [`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](MEMBRANE_INTEGRITY_PASS_V0.md): identity tokens and resolvers stay out of React surfaces; transport carries **events**, not “UI truth.”

---

## 6. Change layers: kernel narrative vs contract freeze vs code

| Layer | Artifact | Change bar |
|-------|----------|------------|
| **PR-1 — Kernel narrative (this document)** | L0/L1/L2 model, ownership story, C2C behavior | Conceptual; updates follow architecture review — **not** a wire contract. |
| **PR-2 — Schema / contract freeze** | [`docs/SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md`](SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md) + JSON under `docs/schemas/` | **Distributed system contract** — envelope, minimal graph, permission row only; **payload bodies excluded**; breaking edits require explicit migration + `schemaVersion` bump. |
| **Implementation (code)** | Firestore paths, gateway, client bus | Ships after contracts validate; domain payload schemas live **outside** the sovereign envelope file. |

### 6.1 Implementation roadmap (code, not same numbering as doc PRs)

**A — Sovereign identity graph (L0)**

- `castleId` graph (owner, delegates, revocations).  
- `userId` ↔ Castle bindings.  
- `homeAnchor` binding **only** via profile authority chain (see `primaryAnchorResolverV0` + Firestore profile membrane when wired).  
- **Subscription list** as derived artifact of permissions, not ad-hoc client state.

**B — Epistemic event bus (L1 → L2)**

Minimal **event type** set (extensible **inside** `payload` or registries — **not** by diluting the frozen envelope):

| Category | Example payload / registry kinds (indicative) | Notes |
|----------|-----------------------------------------------|--------|
| Atmosphere | `atmosphere.delta.v0`, `atmosphere.snapshot.v0` | Validated by separate schemas if needed; **not** in envelope schema |
| Pet / companion | `pet.state.delta.v0`, `pet.presence.sync.v0` | Same |
| Studio | `studio.tier.delta.v0`, `studio.session.mode.v0` | Same |
| Portal | `portal.transfer.request.v0`, `portal.transfer.commit.v0` | Same |

**Broadcast rules (v0):**

- Topics are **namespaced** by `castleId` + capability.  
- **Write path** only from authenticated, rule-verified writers; consumers validate **envelope** `schemaVersion` + domain payload if present.  
- **No UI-originated topic keys** as authority (same class of leak as map-drag-as-identity).

**C — Projection layer (UI)**

- C2C = **render diff** + loading / error surfaces.  
- **No business logic** that mutates cross-Castle truth.  
- **No truth decisions** in components — only apply authorized projections and show observation envelopes where debug allows.

---

## 7. Castle graph (formal minimal contract)

Normative node/edge JSON Schema: [`docs/schemas/sovereign-castle-graph-v0.schema.json`](schemas/sovereign-castle-graph-v0.schema.json).  

Richer ontology (e.g. `PetInstance`, `PortalEndpoint` as first-class nodes) remains **narrative / roadmap** until promoted via a **new** schema file and version bump — not by expanding the v0 minimal contract in place.

---

## 8. Pet sync state machine (v0 narrative)

States (indicative): `local_only` → `sync_offered` → `sync_active` → `sync_degraded` → `sync_revoked`  
Transitions driven by: ACL grant, heartbeat loss, schema mismatch, explicit revoke.  
**Renderer** may lag; **L1 source** remains the pet owner’s Castle; remote view is always **projection**.

---

## 9. One-sentence product truth

The system is a **distributed epistemic operating system**: **ownership and events** are singular and auditable; **portals** are signed **transfers of pointers and state**, not magic UI; **determinism** applies where the code and validators already commit (see frozen core policy elsewhere), while **network fan-out** remains policy-gated and schema-versioned.

---

## 10. Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0.1 | 2026-05-12 | Split **doc PR-1** (this file) vs **doc PR-2** (contract schemas); §6 layers table; graph §7 points to `sovereign-castle-graph-v0`; implementation A/B/C |
| v0 | 2026-05-12 | Initial kernel spec: L0/L1/L2, C2C mappings, permission-first security, event bus sketch |
