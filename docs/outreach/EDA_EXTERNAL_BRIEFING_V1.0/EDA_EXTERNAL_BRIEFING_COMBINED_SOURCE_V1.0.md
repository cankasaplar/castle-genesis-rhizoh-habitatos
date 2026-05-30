---
title: Castle Genesis / Rhizoh — External Briefing Pack v1.0
---

# Castle Genesis / Rhizoh

## External Briefing Pack v1.0

**Audience:** Policy, governance, operational trust, infrastructure advisors  
**Tone:** Research initiative · infrastructure exploration · controlled deployment experiment  
**Date:** May 2026  
**Confidentiality:** First-contact briefing — not a product pitch or technical repository export.

| Document | Contents |
|----------|----------|
| Part 1 | Executive overview |
| Part 2 | High-level architecture |
| Part 3 | Governance & safety notes |
| Part 4 | Guidance areas |

\newpage

# Part 1 — Executive Overview

**Castle Genesis** is a long-running **infrastructure exploration** program: a structured environment for thinking about how digital worlds, continuity, and AI-assisted interaction can be built **without** treating users as probability fields or hiding how the system behaves.

**Rhizoh** is the name of the **governance and continuity layer** inside that program — the part that asks: *what is allowed to change state, what may only be observed, and when may the system connect to the outside world?*

This is **not** marketed as “another AI app.” It is closer to a **research-grade control surface**: how to run a world-like experience with explicit boundaries, auditability, and a slow, legal-aware path to any live data connection.

## Why did it emerge?

Most platforms optimize for engagement and opaque model upgrades. The motivating question here is different:

> Can we build a **non-cheating** digital environment — predictable rhythm, honest limits, and continuity that does not collapse when a vendor model changes?

The work started from art, place, and collaboration (time–place anchors, shared topology) rather than from maximizing session time. Over time it grew into a **serious engineering program**: frozen core execution rules, ingress and legal gates, and formal descriptions of what must *never* leak from “observation” into “control.”

## What are we exploring?

| Theme | Plain meaning |
|-------|----------------|
| **Continuity** | User experience and system state should feel coherent over time, without secret rerolls of “reality.” |
| **Separation of roles** | What the user sees, what the system remembers for audit, and what may execute as “truth” are **not** the same layer. |
| **Controlled external binding** | Connecting to real devices or live signals is **optional, gated, and off by default** until checklists and legal review say otherwise. |
| **Trust without hype** | AI is treated as a **replaceable motor**, not the product. The product is the **protocol** — what stays stable when models change. |

We are **not** claiming a finished global product. We are claiming a **disciplined experiment** with documentation, tests on the control path, and an explicit “ready vs open” decision before any live signal.

## Where are we today?

**Phase 0.5 — “Safe Reality Layer”** (current)

- The **user-facing surface** can be deployed (static hosting, ingress, legal preamble) so the program is **real infrastructure**, not only slides.
- The **data plane** — anything that would ingest live heartbeat or device-like signals from the world — is **intentionally off**. The switch exists in design; it is **not** turned on for production.
- **Perception and copy** have been stabilized so the experience does not feel like a throwaway demo.
- **Formal boundary work** (adversary assumptions, one-way information flow, violation checklists) is written so failures are **named**, not hand-waved.

**Next step (only after human “READY”):** a **controlled Phase 1 probe** — at most one minimal signal type, read-only, still forbidden from changing core sealed state.

## Why move carefully and involve legal / governance voices?

| Risk | Our response |
|------|----------------|
| Looking live before it is safe | Deployment ≠ activation; hosting can exist while **signals stay off** |
| Observation becoming control | Witness logs may grow; **core state must not follow** |
| Regulatory surprise (EU-facing users) | Legal preamble, counsel-oriented packs, minimal Phase 1 signal design |
| “AI governance” as marketing | Moderation and safety as **operational duties** |

## One sentence summary

**Castle Genesis / Rhizoh is a carefully bounded infrastructure experiment: a world-like surface with a frozen control ethic, no live data-plane activation until explicit readiness, and a governance posture that prefers slow trust to fast spectacle.**

\newpage

# Part 2 — High-Level Architecture

**Purpose:** This is a **thought-through architecture**, not only a narrative. Blocks only — no API lists or repository map.

## Layer flow (diagram summary)

```
┌─────────────────────────────────────────────────────────────┐
│  GOVERNANCE / SAFETY — legal, activation gates, moderation   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  INTERACTION — world surface, ingress, legal preamble        │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  ORCHESTRATION — routing, session flow, control plane        │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  AI LAYER     │   │ MEMORY /      │   │ REALTIME      │
│  (transient   │   │ CONTINUITY    │   │ (streams,     │
│   workers)    │   │ core · obs ·  │   │  presence)    │
│               │   │ display       │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        │    AI must NOT drive sealed core      │
        │    Observation must NOT flow back     │
        │    into core (forbidden)              │
        └───────────────────┬───────────────────┘
                            ▼
                 ┌─────────────────────┐
                 │ SEALED CORE STATE   │
                 │ (explicit rules)    │
                 └─────────────────────┘
```

## Layer roles (30 seconds)

| Layer | Role in one line |
|-------|------------------|
| **Interaction** | What people see and enter through (including legal boundary screens). |
| **Orchestration** | How modes, routes, and control decisions are sequenced — **not** free-form scripting. |
| **AI** | Models assist and narrate; they **do not** silently become the authority for sealed state. |
| **Memory / continuity** | **Core truth**, **observation logs**, and **display** are kept apart. |
| **Realtime** | Live transport where the experiment requires it — under orchestration and policy. |
| **Governance / safety** | Law, activation switches, moderation mindset, operational responsibility. |

**Critical design choice (today):** flow from **observation** back into **core** is **forbidden**. External signals, when eventually allowed, are designed to **verify presence**, not to rewrite sealed ledger state.

**Current phase:** Surface and control path — active and testable. Live world signal ingestion — **off** until explicit readiness and legal alignment.

\newpage

# Part 3 — Governance & Safety Notes

## Controlled rollout

| Decision | Meaning |
|----------|---------|
| **Ready?** | Infrastructure, legal pack, and automated checks say we *may* operate responsibly. |
| **Open?** | Any live external signal is allowed — **forbidden** until Ready is explicitly signed. |

Hosting a static site is **not** the same as activating data collection. Rollout is **phased**: surface first, minimal read-only signal later.

## Security awareness

- Least privilege; credentials out of scope for first briefings.
- Data-plane ingestion **designed but not activated** for production.
- Adversary scenarios with **named violation types**.
- Interpretation constraints: external input must not find a side door into sealed state.

## Moderation and harm mindset

- Harmful use anticipated at product and community level.
- Moderation as **ongoing operational duty**, not a one-time safety badge.
- AI surface copy is **non-authoritative** relative to sealed state and legal text.

## Data minimization (Phase 1 design intent)

- Opaque device/session references — no names in pipeline design.
- Liveness, build id, consent epoch — no free-text payload.
- Rate limits and schema validation at gateway.
- No GPS or rich telemetry in default Phase 1 class without separate legal approval.
- Observation logs may grow; **core sealed state must not** grow from those logs.

## User trust approach

- Honest baseline: avoid variable-reward “reality casinos.”
- Ingress transparency: terms and privacy where required.
- No fake social proof in production UI.
- Users should understand the system **observes under rules**, not that it secretly runs them.

## Operational responsibility

- Checklists with human **READY / HOLD** sign-off.
- Exportable ops run artifacts (readiness, violation harnesses).
- Culture documents separate from executable freeze.

**Closing:** We ask whether phased activation, data minimization, non-interference rules, and operational checklists match what you expect before broader exposure.

\newpage

# Part 4 — Guidance Areas

We are not requesting open-ended consulting. We identify **specific lenses** where informed perspective would reduce risk. Partial guidance is welcome.

## We are currently looking for guidance regarding:

**Publication & communication readiness** — research / controlled experiment framing; what not to claim externally; how to describe AI without implying models are the system of record.

**Legal exposure (EU-facing awareness)** — high-level KVKK / GDPR-aligned posture for ingress and minimal future heartbeat class; whether “deployment without activation” is useful for counsel; timing of formal counsel vs READY sign-off.

**AI governance considerations** — human oversight, documentation, change control; non-binding AI output vs sealed core state; red flags on vendor/model churn.

**EU-facing regulatory awareness** — whether phased, opt-in, data-minimized signal direction is directionally sane; categories to exclude in Phase 1; reference frameworks for documenting decisions (not compliance certificates).

**Infrastructure trust expectations** — evidence before linking identity surfaces; credibility of two-gate (ready vs open) model; staging vs production communication norms.

**Cybersecurity considerations** — usefulness of violation taxonomy for security reviewers; responsible disclosure posture; gaps for static+ingress without live ingest.

**Organizational structure for future scaling** — who signs READY/HOLD; legal/ops/engineering separation; advisory board or counsel retainer before scale; avoiding implicit DPO-like duties on founders.

## Helpful output formats

| Format | Useful? |
|--------|---------|
| Short written reactions (email / bullet memo) | ✔ Preferred |
| 30–60 min conversation after Part 1 | ✔ |
| Full repository audit | ✘ Not in first contact |
| Compliance certification | ✘ Out of scope for this phase |

## Not included in first contact

API secrets, internal prompts, full manifesto archive, agent internals, production endpoint details, orchestration internals.

---

*End of briefing pack v1.0 — Castle Genesis / Rhizoh — May 2026*
