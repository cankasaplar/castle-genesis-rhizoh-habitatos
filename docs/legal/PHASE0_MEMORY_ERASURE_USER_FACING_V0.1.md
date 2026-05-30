# Phase 0 — Memory, Continuity & User Rights (User-Facing) v0.1

**Status:** DRAFT — legal-lite for **Controlled Reality Test** (not full DPIA)  
**Tag:** `OPERATIONS` + governance text (does not modify frozen v562–v570 execution subgraph)  
**Audience:** Counsel review, cohort invite copy, ingress legal preamble, support runbook  
**Counsel primary pack:** [`RHIZOH_LEGAL_PRIVACY_INFORMATION_PACK_V1.0.md`](RHIZOH_LEGAL_PRIVACY_INFORMATION_PACK_V1.0.md) · [`LEGAL_REALITY_SPEC_V0.1.md`](../LEGAL_REALITY_SPEC_V0.1.md)

**Related ops:** [`PHASE2_CONTROLLED_REALITY_TEST_V1.0.md`](../ops/PHASE2_CONTROLLED_REALITY_TEST_V1.0.md) · [`DEPLOY_MATRIX_V1.0.md`](../../apps/client/docs/DEPLOY_MATRIX_V1.0.md) §6

---

## 1. Product positioning (binding public sentence)

Rhizoh is **not** a profiling AI or automated decision system.

Rhizoh is an **observation + reaction + continuity rendering** environment:

- **Observation** — structured signals, seals, and logs (append-only where required for integrity).
- **Reaction** — UI and narrative layers that **reflect** state; they do not silently change execution truth.
- **Continuity rendering** — session-local and device-local cues so return visits feel coherent (e.g. continuity strip, visit echo).

**Observation ≠ Execution** — see [`OBSERVATION_FABRIC_V1.md`](../OBSERVATION_FABRIC_V1.md).

Public copy must **not** claim: “we profile you”, “we decide for you”, “we guarantee AI truth”.

---

## 2. What we store (cohort / Phase 2 scope)

| Category | Examples | Purpose | Typical location |
|----------|----------|---------|----------------|
| **Identity (auth)** | Firebase UID, Google email (if used) | Access control, cohort allowlist | Firebase Auth |
| **Session / continuity (UX)** | Last visit time, living-world bootstrap handles, local persistence keys | Continuity strip, “welcome back” rendering | Browser storage (IDB / localStorage per feature flags) |
| **Observation (ops)** | Cohort gate events (`cohort_auth_ok`, allowlist reject), non-PII tags | Closed-test safety, abuse prevention | Client ring buffer + optional server gate |
| **Audit / integrity** | Append-only WAL-style traces, violation observations | Forensic integrity, not covert profiling | Sealed logs when substrate flags on; **off** in default E2-cohort |
| **Narrative (L4)** | LLM/gateway text when enabled | Display only — **non-binding** | Gateway / provider (see transfer note) |

**Not in scope for Phase 2 cohort:** open marketing list, public social graph, SpiralMMO shared world state, robotics execution, automated legal/medical/financial decisions.

**Data-plane:** remains **inert** until signed READY and `VITE_RHIZOH_PHASE1_SIGNAL=1` — [`phase1ActivationGateV0.js`](../../apps/client/src/rhizoh/ingress/phase1ActivationGateV0.js).

---

## 3. Memory vs profiling (risk language)

| Term | Rhizoh meaning | What we avoid saying |
|------|----------------|---------------------|
| **Continuity** | Rendering prior visit context in UI (time since visit, echo lines) | “We analyze your personality” |
| **Memory (product)** | Session + device persistence for experience coherence | “Long-term behavioral profile” |
| **Observation log** | Integrity / cohort gate telemetry | “Surveillance product” |

**AI Act (draft classification):** **Limited risk** — interactive system without high-risk automated decisions. Longer continuity increases **profiling perception risk**; mitigate with transparency (this doc), purpose limitation (closed test), and erase/unlink path below.

**Counsel:** confirm classification statement before any EU-facing public launch beyond closed cohort.

---

## 4. Append-only vs “right to erase” (technical + user story)

### 4.1 Technical truth

- Integrity and audit paths may be **append-only** (no silent rewrite of sealed history).
- This supports **data integrity** and forensic audit — not productized covert profiling.

See [`RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md`](../RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md): corrections via **supersession**, not deletion of sealed entries.

### 4.2 User-facing “silme” (unlink, not necessarily bit-erase)

When a user exercises erasure / deletion request:

| Step | Action |
|------|--------|
| 1 | **Stop processing** — remove email from cohort allowlist; revoke Firebase Auth user if applicable |
| 2 | **Break link** — rotate or tombstone `subjectRef` / continuity keys so stored events are **no longer linkable** to the person without disproportionate effort |
| 3 | **Client data** — instruct user to clear site data; ops purge IDB keys for that UID where stored server-side |
| 4 | **Append-only logs** — retain immutable audit blocks **only** if legally required; strip or pseudonymize identifiers in exportable observation rings where feasible |
| 5 | **Confirm** — email ack within counsel-defined SLA (e.g. 30 days KVKK / GDPR baseline) |

**Public wording (TR sketch):**  
*“Sistem bütünlüğü için bazı kayıtlar değiştirilemez şekilde saklanabilir; kişisel veriniz bu kayıtlarla ilişkilendirilemez hale getirilir veya erişim sonlandırılır.”*

### 4.3 Access & explain (minimum)

| Right | Phase 0 / cohort response |
|-------|---------------------------|
| **Access** | Export: auth email, cohort admission status, last consent ack timestamp (when preamble on) |
| **Rectification** | Correct email / display via support; continuity keys rebuilt on next login |
| **Explain** | Point to [`legal-reality-spec.html`](../../apps/client/public/legal/legal-reality-spec.html) + this doc — narrative non-binding, observation ≠ execution |

**Contact (placeholder — replace with counsel-approved):** privacy@rhizoh.com (or data controller email in KVKK pack).

---

## 5. Cross-border transfer (summary table)

Full note: [`RHIZOH_CROSS_BORDER_TRANSFER_NOTE_V1.0.md`](RHIZOH_CROSS_BORDER_TRANSFER_NOTE_V1.0.md)

| Data | Processor / region | Phase 2 cohort |
|------|-------------------|----------------|
| Static site | Firebase Hosting (Google) | Yes |
| Auth | Firebase Auth (Google) | Yes |
| Edge | DNS / TLS (e.g. GoDaddy; optional Cloudflare) | Yes |
| LLM / voice | Gateway → provider (often US) | **Only if explicitly enabled** + `ai-open-consent` |
| Cohort gate API | Firebase Functions (same project) | If `VITE_RHIZOH_COHORT_SERVER_GATE=1` |

**Minimization:** default cohort build — no Phase1 heartbeat, no open analytics, no Spiral bridge.

---

## 6. Cohort consent (invite template — copy-paste base)

Use in manual invite email / onboarding message (counsel to localize):

> You are invited to a **closed technical and experience test** of Rhizoh (not a public product launch).  
> **Purpose:** validate real UI, session continuity, and observation boundaries with a small group.  
> **Data:** sign-in email, session/continuity cues on your device, and operational logs for safety.  
> **Not offered:** automated decisions about you, public social features, or guaranteed AI factual truth.  
> **Duration:** [DATE – DATE] unless extended with new notice.  
> **Rights:** you may withdraw anytime; request access or erasure via [CONTACT].  
> **By signing in** you confirm you read the site legal preamble and privacy notice.

Ingress: enable `VITE_RHIZOH_LEGAL_PREAMBLE=1` before cohort — [`LEGAL_REALITY_SPEC_V0.1.md`](../LEGAL_REALITY_SPEC_V0.1.md) §5.

---

## 7. AI Act one-paragraph statement (draft)

Rhizoh provides an interactive software surface that **reflects** sealed and observed state through UI and optional narrative layers. It does **not** perform high-risk automated decisions (employment, credit, law enforcement, etc.). Human operators retain activation and cohort gates. AI-generated text is **non-binding** (L4). Limited-risk classification is proposed; counsel must confirm before scaling beyond closed cohort.

---

## 8. Implementation map (no new runtime primitives)

| Concern | Existing artifact |
|---------|-------------------|
| Cohort allowlist | `cohortEmailAllowlistV0.js`, `VITE_RHIZOH_COHORT_*` |
| Server gate | `cohortGateV0` + Hosting rewrite |
| Legal preamble | `ingress_router.js`, `VITE_RHIZOH_LEGAL_PREAMBLE` |
| Public legal pages | `apps/client/public/legal/*.html` |
| Trust / chronicle law | `RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md` |

**Future (productized, not in this doc):** in-app “Request data export / erasure” control — Phase 2 may use **email + ops runbook** only.

---

## 9. Checklist before first external cohort user

- [ ] Counsel skim of this doc + KVKK/privacy HTML
- [ ] Contact address live
- [ ] Invite text includes purpose, duration, rights
- [ ] `VITE_RHIZOH_LEGAL_PREAMBLE=1` on cohort host build
- [ ] Allowlist or server gate active
- [ ] `VITE_DEBUG=0`, Spiral off, Phase1 signal off
- [ ] Erasure runbook owner named (founder / DPO contact)

---

*v0.1 — Phase 0 legal-lite; upgrade to full DPIA when leaving closed test.*
