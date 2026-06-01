# Rhizoh — Grammar Constitution System (RGCS) v0 (SSOT)

**Status:** ACTIVE — semantic evolution policy (not execution authority)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-01  
**Parents:** [`RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md`](RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md) · [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md)

**Names (locked):**

| Term | Meaning |
|------|---------|
| **GALS** | Grammar-as-a-Living-System — language grows under seal |
| **RGCS** | Rhizoh Grammar Constitution System — three-layer model below |
| **CSES** | Controlled Semantic Evolution System — correct operational form |

**Binding sentence (locked):**

> **Rhizoh language evolves in meaning space, not in rule space.**

**Freedom / limit (locked):**

| Rhizoh may | Rhizoh must not |
|------------|-----------------|
| Produce new **meaning variations** | Invent new **rule systems** |
| Create new **transitions** bound to existing axes | Mutate **constitution pillars** |
| Reconfigure surface sense in context | Optimize language into opaque jargon |

---

## 1. What this is not

| ❌ | ✅ |
|----|-----|
| Uncontrolled AI language generation | Rule-based evolution + **sealed** extension |
| Self-modifying grammar core | Self-expanding **dictionary** + meaning variations |
| UI that invents new interaction physics | Surfaces that **project** fixed grammar |

**Risk if wrong:** powerful but **unintelligible organism** — user loses meaning; UI becomes internal jargon machine.

---

## 2. RGCS — three layers

### A) CONSTITUTION (immutable core)

Never changes without an explicit versioned constitution bump (not v0 scope).

| Pillar | Question | Immutable ids |
|--------|----------|----------------|
| **STATE** | Where am I? | `state` |
| **INTENT** | What am I doing? | `explore` · `produce` · `observe` · `connect` |
| **FIELD** | How does it feel? | `density` · `deformation` · `tension` |
| **TRANSITION** | What changed? | `entry` · `micro_rtl` · `pal_restore` |

Code: `RHIZOH_GRAMMAR_CONSTITUTION_V0` in [`rhizohGrammarConstitutionV0.js`](../apps/client/src/rhizoh/runtime/rhizohGrammarConstitutionV0.js).

### B) DICTIONARY (growing, tracked)

Surface and product tokens map **onto** constitution — they do not replace it.

| Token class | Examples | Seal |
|-------------|----------|------|
| Surface | `studio`, `map`, `chat`, `world` | `dictionary_seal_v0` |
| Continuity | `continuity`, `re_entry`, `pal` | logged extension |
| Mode | `creative`, `real_map` | maps to STATE + surface |

New dictionary entries require: **grammar mapping** + **mutation check** (no new pillars).

### C) EVOLUTION RULES (controlled power)

| Rule | Behavior |
|------|----------|
| **E1** | New concept only if mappable to existing constitution |
| **E2** | Every accepted variation carries `seal` + `parent_pillar` |
| **E3** | Reject proposals that add pillars or rewrite INTENT enum |
| **E4** | Meaning variation may re-weight context; may not drop continuity |

Operational name: **CSES** — Controlled Semantic Evolution System.

---

## 3. Test case — “studio katmanına geçelim”

| Step | Grammar action |
|------|----------------|
| 1. Parse intent | `ENTER` + surface target |
| 2. Grammar mapping | `studio` → `SURFACE_STATE` · intent bias → `produce` |
| 3. Field transition | Context strip → production play-call |
| 4. Anchored output | PAL / user anchor preserved · continuity intact |
| 5. Mutation check | No new pillar · dictionary token already sealed |

Reference implementation (deterministic v0): `resolveGrammarFromUtteranceV0` in [`rhizohGrammarConstitutionV0.js`](../apps/client/src/rhizoh/runtime/rhizohGrammarConstitutionV0.js).

**Deeper goal (when CSES is live):** opening “studio” is not only navigation — system **reconfigures studio meaning** for current anchor + intent — user still speaks the **same language**.

---

## 4. GALS vs CSES

| Model | Description |
|-------|-------------|
| **GALS (aspiration)** | Language is alive — grows with use |
| **CSES (guardrail)** | Growth only in **meaning space**; constitution frozen |

```
GALS (living)  ∩  CSES (controlled)  =  Rhizoh production posture
```

---

## 5. Basketball mapping (rules vs playbook)

| Layer | Basketball | Rhizoh |
|-------|------------|--------|
| Constitution | Game rules (physics) | STATE · INTENT · FIELD · TRANSITION |
| Dictionary | Playbook entries | studio · map · PAL · … |
| Evolution | In-game reads | Context-bound meaning variation |

Nobody changes the **physics**; plays and reads expand.

---

## 6. Observation ≠ execution

RGCS modules **propose and seal mappings** for client/runtime projection. They do **not**:

- bypass gateway authority,
- mutate frozen ghost `phase*.js`,
- or treat LLM output as new constitution.

Agents may influence **interpretation** of utterances into dictionary mappings; **execution** stays behind existing membranes.

---

## 7. Related

| Doc | Role |
|-----|------|
| [`RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md`](RHIZOH_T0_COGNITIVE_GRAMMAR_V0.md) | T0 four-axis grammar |
| [`RHIZOH_UI_INTENT_ATLAS_V0.md`](RHIZOH_UI_INTENT_ATLAS_V0.md) | Pre-runtime intent registry |
| [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md) | FIELD dialect |

---

*RGCS v0 — grow the dictionary; seal the constitution.*
