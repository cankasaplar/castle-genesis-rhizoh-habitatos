# Rhizoh.com User Experience V1

**Tag:** `RESEARCH-ONLY`  
**Status:** Product perception frame — not ingress copy SSOT  
**Production surface SSOT:** [`RHIZOH_T0_EXPERIENCE_SHELL_V1.md`](RHIZOH_T0_EXPERIENCE_SHELL_V1.md)  
**Related:** [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md) · [`PERCEPTUAL_PHYSICS_KERNEL_V2.md`](PERCEPTUAL_PHYSICS_KERNEL_V2.md)

---

## 1. One journey (user mental model)

```
Castle  →  Castle  →  Experience
  ↑           ↑            ↑
 giriş    bağlantı    Octo · map · studio · event
                              ses · video · etkileşim
```

There is no “exit” — only **transition**. Each hop feels like the same world continuing.

User never perceives four systems. They perceive:

| Felt | Invisible |
|------|-----------|
| Octo as live presence | Execution motor |
| Map as world | Router / executor graph |
| UI chrome as habitat | Alignment engine |
| Space feels alive | Fracture layer (no panel · no debug · no text · no dashboard) |

Fracture outputs **only sensation**:

- space feels alive
- camera slightly late
- Octo is here but not-quite-here

---

## 2. Founder = Castle user (design lock)

| Surface | Founder in prod | Engineer in design |
|---------|-----------------|-------------------|
| Control / admin | **No** | Spec + CI only |
| Debug / metrics HUD | **No** (dev flag ceiling) | Local mirror |
| Execution graph | **No** | Architecture docs |
| Perception | **Yes** — same as any user | Defines *desired feel*, does not command runtime |

> Rhizoh is not a **tool**. Rhizoh is a **shared world**.

The founder defines which **reality feel** the system should produce — without controlling it live.

---

## 3. Rhizoh model vs classic multiplayer

| Classic multiplayer | Rhizoh model |
|--------------------|--------------|
| Shared world state | **Shared session** container |
| Shared physics | **Independent perception** per node |
| Shared truth | **Aligned distortion** (fracture post-render) |
| One execution graph | **Execution graph never shared** |

Users connect to a **shared perception field** (session), not peer-to-peer truth merge.

---

## 4. Three V1 systems (implementation split)

| System | Doc | Question it answers |
|--------|-----|---------------------|
| **Session Graph** | [`SESSION_GRAPH_V1.md`](SESSION_GRAPH_V1.md) | Castle-to-Castle edges · presence · who is in which field |
| **Octo Presence Field** | [`OCTO_PRESENCE_FIELD_V1.md`](OCTO_PRESENCE_FIELD_V1.md) | State projection · camera · audio→field · reactive presence |
| **Event System** | [`EVENT_SYSTEM_V1.md`](EVENT_SYSTEM_V1.md) | Concert · live · broadcast · watch · lifecycle |

Parent protocol: [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md)

---

## 5. Rhizoh “orchestration” (clarified term)

Rhizoh **session orchestration** = **presence graph + projection sync setup**

| Rhizoh orchestrates | Rhizoh never orchestrates |
|---------------------|---------------------------|
| Session container open/close (protocol) | Execution graph |
| Castle↔Castle temporary edges | WAL / spatial truth writes |
| Projection sync hints (soft) | Network transport ownership |
| Context for Octo / Habitat / chat | Decisions that bypass user intent grammar |

Previous doc line “Rhizoh ≠ Session Orchestrator” meant **≠ execution master**. This doc refines: **= presence-session coordinator**, still observation-bounded ([`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)).
