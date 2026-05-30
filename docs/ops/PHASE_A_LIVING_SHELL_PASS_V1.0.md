# Phase A — Living Shell Pass v1.0

**Status:** ACTIVE (founder-only, pre-cohort)  
**Tag:** `OPERATIONS` — experience gate, not architecture proof  
**Prerequisite for:** [`PHASE2_CONTROLLED_REALITY_TEST_V1.0.md`](./PHASE2_CONTROLLED_REALITY_TEST_V1.0.md) MODE 2 (external cohort)

**Legal framing:** [`PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md`](../legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md)  
**Deploy posture:** [`DEPLOY_MATRIX_V1.0.md`](../../apps/client/docs/DEPLOY_MATRIX_V1.0.md) — MODE 1 (E2-F), `VITE_DEBUG=0` for “felt like cohort” passes

---

## 1. Mental shift (what this phase measures)

| Old question (architecture) | New question (Phase A) |
|-----------------------------|-------------------------|
| Is RCML correct? | Is there a **livable digital place** here? |
| Are boundaries sealed? | Does **presence** land in the first seconds? |
| Is phase gate valid? | Does **return** feel like memory, not a log line? |

A system can be technically correct and feel **dead**. Phase A measures **felt aliveness**, not correctness.

**Product truth surface:** UI + session + atmosphere — not orchestrator metrics, not debug overlays, not text-only proof.

---

## 2. Founder Living Sessions (protocol)

**Who:** Founder only.  
**When:** One uninterrupted block (45–90 min), ideally once at night with headphones.  
**How:** User-like entry — no code changes during the session.

| Rule | Why |
|------|-----|
| **Debug off** | `VITE_DEBUG=0` on `rhizoh.com` (or prod-equivalent build) — overlay kills “place” |
| **Silent observation** | No Slack, no fixing mid-session — notes after |
| **No “engine talk”** | Do not open devtools unless stuck; primary evidence = felt experience |
| **One profile** | Same browser profile for Session A + B (return test) |
| **Short notes** | Voice memo or 10 lines max per screen — not a spec |

**Optional atmosphere:** dim room, headphones — only if it matches how you want cohort to feel.

---

## 3. Scorecard (1–5 each)

Rate **felt experience**, not technical pass/fail.

| # | Question | 1 (fail) | 5 (pass) |
|---|----------|----------|----------|
| **A1** | **First entry** — fear, void, or “I arrived somewhere”? | Dashboard / jargon / anxiety | Calm arrival, one clear door |
| **A2** | **Castle** — text widget or **presence**? | Static copy, no body | Glow, motion, distant life, sound hint |
| **A3** | **Continuity** — log line or “world lived while I was away”? | Timestamp only | Weather/time echo, strip feels alive |
| **A4** | **Return (10–15 min)** — remembered as a **place**? | Cold reset, same generic greeting | Strip + micro-atmosphere shift, not text-only |

**Gate to MODE 2 cohort:** A2, A3, A4 each **≥ 4** (founder honest score). A1 **≥ 3** minimum.

**North-star sentence (after session):**

> *“Tamam… artık burası sadece bir uygulama değil.”*

If that sentence is not true, **do not invite cohort** — tune surface first (§5).

---

## 4. Session script

### Session A — first arrival (~20 min)

1. Incognito **or** clean profile → `https://rhizoh.com`
2. Legal preamble (if on) → Google login
3. Stop: **10 seconds** — what do you feel? (void / tech / place)
4. Observe → living world entry → **Enter Castle**
5. One intentional interaction (move, select, navigate)
6. Score A1–A3; note one moment that felt most “alive” and one most “dead”

### Session B — return (~15 min, 10–15 min after leaving)

1. Same profile, same device
2. Re-open site → login if needed
3. Read continuity strip / welcome echo **before** clicking further
4. Re-enter Castle — did atmosphere shift?
5. Score A4; compare to A3

### Optional Session C — hard refresh edge

1. Hard refresh on Castle route
2. Note: trapped / misled / acceptable loss of continuity
3. Does not block cohort if A2–A4 strong; document in SESSION_LOG

---

## 5. Post-session notes (no code during session)

Answer in plain language (TR or EN):

| Prompt | Your note |
|--------|-----------|
| Which screen **broke the spell**? | |
| Which transition felt like an **app**, not a place? | |
| Which moment felt like a **real place**? | |
| Which text was **too technical**? | |
| Where was **sound missing**? | |
| Where was **motion missing**? | |
| Where was there **too much explanation**? | |
| Where did the world feel **dead**? | |

**First product decisions often emerge here** — rhythm, silence, transitions, presence — not new subsystems.

---

## 6. What to tune (surface, not core)

Phase A changes should prefer **living surface** over new engines:

| Lever | Examples (repo) |
|-------|------------------|
| Copy / ingress tone | `RhizohLivingWorldEntryShell`, ingress router |
| Continuity strip | `RhizohLivingContinuityStrip`, `livingWorldPersistenceUxV0` |
| Atmosphere tick | `RhizohAtmospherePresenceBridge`, `rhizohLivingLoopOrchestratorV0` |
| Mutation echo | `worldMutationFeedbackV0` |
| Transitions | entry shell, Castle flight HUD |
| Minimal ambient audio | launch polish / atmosphere (staging first) |

**Do not open for founder pass:** Studio, SpiralMMO, robotics, Phase1 data-plane, ontological boot gate `1`, public cohort.

**Frozen core:** v562–v570 `ghost/phase*.js` — no topology changes; surface regression only.

---

## 7. Relationship to other phases

```text
Phase 0-lite (legal framing)
    → Phase A (this doc) — founder “does it live?”
        → Phase 2 MODE 2 — 5–10 cohort
            → Phase 3 — voice/agent (separate host)
                → Phase 4 — Spiral (separate runtime)
```

| Phase | Question |
|-------|----------|
| Architecture / RCML | “Is the engine correct?” (CI, papers, observe pipeline) |
| **Phase A** | “Is there a habitable digital place?” |
| Phase 2 | “Do trusted humans feel that too?” |

---

## 8. SESSION_LOG entry template

Copy into [`docs/academic/SESSION_LOG.md`](../academic/SESSION_LOG.md):

```markdown
### Phase A — Living Shell Pass (YYYY-MM-DD)

- Host: rhizoh.com · debug: 0
- Scores: A1=_ A2=_ A3=_ A4=_
- North-star (“not just an app”): yes / no
- Alive moment:
- Dead moment:
- Tune next (surface only):
- Cohort ready: yes / no (A2–A4 ≥ 4)
```

---

## 9. What Rhizoh is *not* optimizing for (Phase A)

| Common AI product | Rhizoh Phase A lens |
|-------------------|---------------------|
| Utility / productivity | **Habitat + continuity** |
| Assistant automation | **Observation + reaction rendering** |
| Chat correctness | **Presence + return feeling** |

Motor (RCML, entropy, coherence) = necessary; **value** = living digital habitat felt in the shell.

---

*v1.0 — Phase A ops SSOT; bump when scorecard or gate criteria change.*
