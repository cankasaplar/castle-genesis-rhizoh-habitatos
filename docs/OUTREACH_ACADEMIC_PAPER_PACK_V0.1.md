# Academic Paper Pack — Rhizoh Continuity Protocol (v0.1 draft outline)

**Tag:** `RESEARCH-ONLY` · must align with [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) · [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](MANIFESTO_DISTRIBUTION_PACK_V0.1.md) §0–§9

**Layer:** Interface (academic) — under Charter (truth) and Protocol (checksum). This outline does **not** extend execution authority.

**Status:** Outline for PDF/Notion → future `https://rhizoh.com/manifesto` (domain pending)

---

## Academic risk warning (read first)

Academic outreach is the **highest drift risk** in the stack:

| Common failure | Rhizoh counter-discipline |
|----------------|---------------------------|
| Seriousness = jargon density | **Operational terms** tied to tests and invariants |
| Science = metaphor | **Claims bound to code paths** and CI gates |
| Brand = theory name | **EFIR-α = invariant class label**, not marketing slogan |
| Narrative = contribution | **Testable consistency** as contribution |

**EFIR rule:** Use **EFIR-α** only where you cite a **frozen class definition** (§23). In title, abstract, and tweet-adjacent summaries, prefer **continuity protocol / observation–execution separation**. EFIR in prose without a formal definition = epistemic drift.

**Spine for reviewers:** Observation ≠ Execution — interpretation does not mutate sealed state.

---

## Three-layer stack (paper must respect)

| Layer | Source | Paper may |
|-------|--------|-----------|
| Charter | Honest Baseline | State ethical boundaries, modest claims |
| Protocol | Manifesto §0–§9 | Define terms reviewers can audit |
| Interface | This outline | Frame contribution; **no new invariants** |

---

## Working title (options — pick one tone)

**Preferred (protocol-first):**  
*Rhizoh: A Continuity-First Digital Habitat Protocol with Observation–Execution Separation and Geographic State Anchors*

**Technical (EFIR as label, not headline):**  
*EFIR-α as a Frozen Epistemic Membrane Class: Separating Verified State from Non-Executive Observation in a Client-Side Prototype*

**Avoid as primary title:**  
*“Non-Learning Spacetime Epistemic Field Renderer”* — reads as metaphor-brand; weak falsifiability for reviewers.

---

## Abstract (draft, ~200 words — revised)

Generative stacks often collapse **inference, authority, and state mutation** into one invisible chain. We describe **Rhizoh**, a client-side **continuity protocol** that enforces an explicit **observation–execution boundary**: companions and LLM ingress produce **non-executive** interpretation; sealed execution and WAL-backed state require **derived, traceable** paths. Geographic presence uses **WGS84-selected satellite nodes** (`node:{slug}_satellite`) as **state anchors**, not user personas or lore centers. A frozen execution subgraph (v562–v570) acts as **immutable infrastructure**; upper layers evolve without breaking reality reference. We report an operational prototype with membrane CI checks, shadow onboarding (`SOFT_INIT`), forensic compression signatures (`epi_sig_*`) that **do not** mint boot/execution tokens, and narrative **provenance** tagging. The architectural class **EFIR-α** (Epistemic Field Interaction Runtime, alpha) names the **one-way membrane** invariant; it is a **technical label**, not the product identity. **Contribution:** a testable separation discipline and anchor model — not a claim of superhuman intelligence or solved alignment.

---

## 1. Introduction

- Problem: self-conditioning loops (model output → training/context → authority) and **narrative → state** creep in agentic UIs.
- Limitation of intelligence-first framing: “smarter model” does not restore **continuity, place, or auditability**.
- Contribution (modest, falsifiable):
  1. **Observation ≠ execution** as enforced architecture.
  2. **Continuity-first** protocol (LLM as replaceable motor).
  3. **Distributed geographic anchors** (map pick → verifiable `nodeId`).
  4. **EFIR-α** as named invariant class for the membrane (formal card in §23).
- **Not claimed:** AGI, consciousness, market outcomes, universal epistemic solution.

## 2. Related work

| Area | Rhizoh contrast |
|------|-----------------|
| Event sourcing / WAL | Append-only traces; **no** upward narrative writeback |
| CRDTs / collaboration | Focus on **membrane** and seal discipline, not generic merge |
| Digital twins / GIS | Map = **reference anchor**, not game world or twin authority |
| LLM agents / tool use | Tools **suggest**; executive flag false; provenance on narrative |
| Blockchain / integrity | Forensic signatures; **no** token/NFT hype in this paper |
| Philosophy of tech / HCI | Cite for **human rhythm** and attention-economy refusal — not as proof |

## 3. System model (testable claims)

**3.1 Planes (operational names)**

| Plane | Role | Test hook |
|-------|------|-----------|
| Execution (E) | Frozen anchor, seals, deterministic subgraph | `stabilization:validate-graph` |
| Causal / derived | Append-only traces, WAL | Replay, signature stability |
| Observation (O) | Read-only projection | No write-back tests |
| Narrative (D) | Rendered with provenance | `∀ narrative ⇒ derived` discipline |

**3.2 EFIR-α (invariant label only)**

Formal card: [`TEMPORAL_IDENTITY_CONTINUITY_V0.md`](../apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md) §23.

```
EFIR-α := R( C(E) , T(E) )   // interpretation in paper — not executable slogan
```

- **C (entanglement):** documented as **closed** in α.
- Paper uses EFIR-α when discussing **class invariants**; paper uses **Rhizoh** when discussing **deployed protocol and onboarding**.

**3.3 What reviewers can try to falsify**

- Narrative path cannot set `bootValidityToken` / execution seals without derived chain.
- Observation APIs do not mutate sealed state (tests + runbook checks).
- Distinct map picks → distinct `node:*_satellite` slugs (catalog + haversine rules).

## 4. Implementation sketch (honest scope)

- Reference: [`RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`](RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md) §0 (EFIR layers X→B→C→D).
- Frozen core **boundary** — paper does not claim edits to v562–v570.
- Lab AI / external ingress: untrusted producer — [`EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md`](EXTERNAL_LAB_AI_INTEGRATION_SPEC_V1.md).
- **Roadmap (label explicitly):** `packages/plugin-host`, extracted companion-sdk — not shipped claims.

## 5. Sovereign satellite anchors & shadow continuity

**Geography policy (paper language):**

- Nodes are **WGS84-derived state anchors**, not characters or lore cities.
- Cohort examples may list Ankara, Kadıköy, Beşiktaş, Barcelona, İzmir as **illustrative slugs** — not a mandatory genesis center.
- Onboarding: map pick → `node:{slug}_satellite` — [`FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md`](../apps/client/docs/FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md).

**Shadow continuity:**

- `SOFT_INIT`, WAL tick 0, **`bootValidityToken` absent** on friend path.
- `epi_sig_*` as compression/forensic artifact — **not** password, persona, or execution ticket.

**Do not write:** “Kadıköy genesis,” “founding five heroes,” person-named nodes.

## 6. Evaluation (honest scope — consistency tests)

| Claim type | Evidence |
|------------|----------|
| Membrane / graph | CI: `validate-graph`, `validate-membrane-v0`, client boundary quick pass |
| Trace / signature | Stability of `epi_sig_*` under replay fixtures (cite test files) |
| Provenance | `narrativeSourceProvenanceV0` unit tests |
| Post-go-live | Integrity loop states `LIVE_OK` / `DEGRADED` / `QUARANTINE` (if deployed) |

**Not claimed (yet):** Large-N user study, clinical outcomes, benchmark SOTA on LLM tasks.

**Framing:** Contribution is **architectural consistency under test**, not user delight scores.

## 7. Discussion

- **EFIR-β:** reserved question (correlation → constraint) — separate paper; do not imply α is incomplete product.
- **Limits:** client-heavy prototype; federation scale; formal verification depth.
- **Ethics:** anti-manipulation stance (no variable-reward design); attention economy contrast — cite manifesto §7, not as moral superiority claim.
- **Model independence:** LLM swap should not break continuity — engineering goal, bounded by current gateway facts.

## 8. Conclusion

Rhizoh is positioned as a **geographically verifiable, time-bound, ethically bounded digital reality protocol** whose value is **which promises hold under test**, not narrative charisma. EFIR-α names the membrane class; the artifact is **continuity discipline**, not oracle intelligence.

---

## Figures to prepare

1. **Observation ≠ execution** — one-way membrane (from production architecture §0).
2. **Three-plane / four-layer** — X→B→C→D with entanglement blocked (no mystic “field” artwork).
3. **Map pick → nodeId** — anonymized screenshot; caption: state anchor, not lore.
4. **Provenance chain** — optional UI crop or schema diagram.
5. **CI / test pipeline** — small box diagram: claim → test (reviewers trust this).

---

## What NOT to write (academic drift block)

| Block | Why |
|-------|-----|
| “Non-learning spacetime field” as hero phrase | Metaphor reads as physics cosplay |
| EFIR in every sentence | Sloganization; weakens firewall |
| AGI / alignment solved / consciousness | Violates charter humility |
| Kadıköy-only genesis narrative | Violates distributed geography policy |
| Person-named nodes or “founding pantheon” | Lore universe drift |
| “Instrument the universe” without test mapping | Science = metaphor error |
| Token / Web3 salvation arc | Off-protocol |
| Smarter-model leaderboard claims | Intelligence-first contradiction |

**Pre-submit checklist:** Every section has at least one **test, runbook step, or CI command** OR is labeled pure future work.

---

## Reviewer FAQ (short)

| Question | Answer shape |
|----------|----------------|
| Is this AGI? | No — separation architecture + prototype. |
| Is EFIR the product? | No — **Rhizoh protocol**; EFIR-α = invariant class label. |
| Can narrative change state? | Only via derived/sealed paths; story alone does not boot. |
| Why geography? | Re-anchor digital activity to verifiable place + time. |
| What’s new vs event sourcing? | Membrane + sovereign node + provenance + frozen execution floor. |

---

## Source docs (canonical)

| Topic | Repo |
|-------|------|
| EFIR synthesis | `TEMPORAL_IDENTITY_CONTINUITY_V0.md` §17 |
| EFIR-α frozen class | §23 |
| Observation policy | `OBSERVATION_FABRIC_V1.md` |
| Charter | `RHIZOH_HONEST_BASELINE_CHARTER_V1.md` |
| Checksum | `MANIFESTO_DISTRIBUTION_PACK_V0.1.md` §0–§9 |
| First cohort ops | `OUTREACH_FIRST_FIVE_SOVEREIGN_NODES_V0.1.md` |
| Social tone guard | `OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md` |

---

## Export note

*Export to PDF when domain live. Hub page links: Charter → Manifesto §0–§9 → this outline. EFIR appears in the PDF **where formally defined**, not as cover-tagline.*

---

*Rhizoh is no longer primarily “tellable” — it is **consistency-testable**. The paper should read like a protocol appendix reviewers can poke, not a manifesto they must believe.*
