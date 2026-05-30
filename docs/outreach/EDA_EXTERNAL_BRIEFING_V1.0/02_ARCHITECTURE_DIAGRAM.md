# High-Level Architecture (One Page)

**Purpose:** Show that the effort has a **thought-through architecture**, not only a narrative.  
**Detail level:** Blocks only — no API lists, no repository map.

---

## Layered view

```mermaid
flowchart TB
  subgraph interaction [Interaction layer]
    UI[World-like surface · map · presence UI]
    ING[Ingress · legal preamble · access gate]
  end

  subgraph orchestration [Orchestration layer]
    RT[Routing · session flow · product modes]
    CP[Control plane · deterministic rules]
  end

  subgraph ai [AI layer]
    LLM[Language models · transient workers]
    NAR[Narrative / assist · non-binding to core truth]
  end

  subgraph memory [Memory / continuity layer]
    CONT[Continuity protocol · identity discipline]
    OBS[Observation / audit witness · append-only]
    CORE[Sealed core state · changes only by explicit rules]
  end

  subgraph realtime [Realtime systems]
    RTM[Realtime transport · streams where enabled]
    PRES[Presence · session sync · bounded]
  end

  subgraph governance [Governance / safety awareness]
    LEG[Legal & consent framing]
    ACT[Activation gates · ready vs open]
    SAF[Moderation · abuse awareness · rollout discipline]
  end

  UI --> RT
  ING --> RT
  RT --> CP
  CP --> CORE
  LLM --> NAR
  NAR -.->|must not drive| CORE
  OBS -.->|forbidden back-flow| CORE
  CORE -->|read-only projection| UI
  RTM --> PRES
  PRES --> UI
  LEG --> ING
  ACT --> CP
  SAF --> RT
  CONT --> CORE
```

---

## How to read this (30 seconds)

| Layer | Role in one line |
|-------|------------------|
| **Interaction** | What people see and enter through (including legal boundary screens). |
| **Orchestration** | How modes, routes, and control decisions are sequenced — **not** free-form scripting. |
| **AI** | Models assist and narrate; they **do not** silently become the authority for sealed state. |
| **Memory / continuity** | Three ideas kept apart: **core truth**, **observation logs**, and **display**. |
| **Realtime** | Live transport where the experiment requires it — always under orchestration and policy. |
| **Governance / safety** | Law, activation switches, moderation mindset, and operational responsibility. |

**Critical design choice (today):** arrows from **observation** back into **core** are **forbidden** by policy and contract. External signals, when eventually allowed, are designed to **verify presence**, not to rewrite the world’s sealed ledger.

---

## Current phase (one line)

**Surface and control path:** active and testable. **Live world signal ingestion:** off until explicit readiness and legal alignment.

*Architecture one-pager v1.0 — May 2026*
