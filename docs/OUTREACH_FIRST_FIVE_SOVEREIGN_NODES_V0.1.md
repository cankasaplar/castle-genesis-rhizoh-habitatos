# First Five Satellite Anchors — Verification Cohort (v0.1)

**Tag:** `RESEARCH-ONLY` (outbound ops) · aligns with [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](MANIFESTO_DISTRIBUTION_PACK_V0.1.md) §0–§9 · [`OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md`](OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md) tone contract

**Principle:** Sequential **verification cohort** — not open signup blast, not character-universe launch.

---

## Three-layer stack (where this doc sits)

| Layer | Document | Role |
|-------|----------|------|
| **Core (Charter)** | [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) | Reality, state, execution boundaries |
| **Protocol (Manifesto)** | [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](MANIFESTO_DISTRIBUTION_PACK_V0.1.md) | Behavior rules + contributor checksum |
| **Interface (Outreach)** | This file + social copy | Controlled external contact language |

This doc is **Interface only**. It must not invent lore, personality canon, or execution claims that Charter/Protocol do not support.

---

## Critical distinction: person ≠ node

| | **Person (invitee)** | **Satellite node (system)** |
|---|------------------------|-----------------------------|
| What it is | Human in the verification cohort | **State anchor** — WGS84-derived `node:{slug}_satellite` |
| Produces | Consent, map pick, shadow session | `SOFT_INIT`, `epi_sig_*`, registry row |
| Outreach may use | First name in **private** WhatsApp | **Never** “Eren’s realm” / character arc |
| Must not become | Product mascot, lore protagonist | Identity brand, feed profile, NFT persona |

**Rule:** Names below are **cohort scheduling labels**, not node IDs.  
**Rule:** `nodeId` comes from **map selection + slug catalog** — see [`FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md`](../apps/client/docs/FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md).

Examples (illustrative only — each invitee picks their own point):

| Map pick (approx.) | `nodeId` (runtime) |
|--------------------|---------------------|
| Ankara | `node:ankara_satellite` |
| Kadıköy | `node:kadikoy_satellite` |
| Beşiktaş / Serencebey | `node:besiktas_satellite` |
| Barcelona | `node:barcelona_satellite` |
| İzmir | `node:izmir_satellite` |

**Map is reference system, not lore wallpaper.** Coordinates anchor state; they do not narrate a single “genesis city” for everyone.

---

## Geography policy (cohort-wide)

| Old (reject) | New (use) |
|--------------|-----------|
| Single center (e.g. Kadıköy only) | **Distributed** `*_satellite` anchors |
| Symbolic / lore geography | **Verifiable** WGS84 pick → slug |
| One genesis story for all | Each invitee: own pick, own `nodeId` |
| “Join our city” | “Pick your anchor on the map” |

**Scale implication:** Identity does not centralize in one place; continuity **replicates** under the same honest baseline.

---

## Verification cohort (scheduling)

**Invitees (humans):** Eren · Ceyda · Karden · Nisa · Can (Kaptan — orchestrator, not a public “sixth node” story)

| Order | Invitee | Human ops role | Node rule |
|-------|---------|----------------|-----------|
| 1 | Eren | First `SOFT_INIT` + Captain shadow check | Their map pick → `node:*_satellite` |
| 2 | Ceyda | Second anchor; optional public-safe screenshot | Same — **not** tied to Eren’s city |
| 3 | Karden | Third anchor; topology / trace curiosity | Same |
| 4 | Nisa | Integrity witness + runbook pass | Same |
| — | Can (Kaptan) | Denetim, registry table, no friend console | Does not need a “mascot node” narrative |

**Do not say:** “First five heroes,” “founding pantheon,” “Kadıköy genesis circle.”  
**Do say:** “First five **satellite state anchors** under observation-only rules.”

---

## Timeline (domain shutter)

| Phase | Action |
|-------|--------|
| **T−7d** | Private message: link coming, **2 taps**, pick your place on map — [`FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md`](../apps/client/docs/FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md) |
| **T0** | Staging/prod URL + production membrane flags live |
| **T0+1h** | Eren → Ceyda → Karden **sequential** (spacing for Captain verification, not hype stagger) |
| **T0+24h** | Nisa: technical pass (§17–§23 / runbook) |
| **T+3d** | One Build in Public micro-proof — [`OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md`](OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md) series (no character poster) |
| **T+7d** | Academic pack to 3–5 researchers (curated, cold) |

---

## Message templates (private — tone: calm infrastructure)

### T−7d (WhatsApp / Telegram)

> Rhizoh linki geliyor. Sohbet botu değil — **konum + süreklilik çıpası**. Haritadan yerini seç, iki dokunuş. Şehir sabit değil; senin seçtiğin nokta `node:*_satellite` olur. Hazır olunca yaz.

### T0 (link live)

> Link: [url]  
> Haritada yerini seç → onayla. Ekranda `nodeId` ve `epi_sig_*` görürsün; bunlar **iz / çıpa**, şifre veya “karakter kimliği” değil. Bitince: **Bitti Kaptan!**

### Captain-only (never forward to friends)

See [`CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md`](CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md) — shadow continuity, no `bootValidityToken`, registry row.

---

## Success criteria (technical — not social vanity)

- [ ] 4× invitee `SOFT_INIT` shadow records (Captain log)
- [ ] 4× **distinct** `node:*_satellite` from **distinct** map picks (not 4× same slug unless truly same place)
- [ ] 4× `epi_sig_*` archived (redacted public if shared)
- [ ] Zero `bootValidityToken` on friend sessions
- [ ] At least 1 **public-safe** screenshot approved (map + signature line only; no PII, no debug HUD)
- [ ] Outreach posts pass social copy **pre-flight** (no AGI, no Kadıköy-only, no savior tone)

Captain table: [`CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md`](CAPTAIN_BACKSTAGE_VERIFICATION_V0.1.md)

---

## What NOT to do (cohort outreach)

| Block | Why |
|-------|-----|
| Cast invitees as lore characters | Interface drifts into “character universe” |
| “Join us in Kadıköy” (mandatory) | Violates distributed geography policy |
| Node named after person (`node:eren_*`) | Node = place anchor, not persona ID |
| Ritual / elite / chosen-one language | Product cult; contradicts honest baseline |
| EFIR as hype slogan | EFIR = technical invariant tag only (see social copy) |
| Promise execution power from narrative | §3 No boot token from story |

**Remember:** Rhizoh stabilizes as much by **what we refuse to say** as by what we say.

---

## Expansion gate (after cohort)

Do **not** open wide waitlist until:

1. Domain + HTTPS stable 72h  
2. Captain table complete (4 nodes + signatures)  
3. One external researcher replies to academic pack  
4. Post-go-live integrity loop green or documented `DEGRADED` — [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md)

---

## Pair with

| Doc | Use |
|-----|-----|
| [`OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md`](OUTREACH_SOCIAL_LAUNCH_COPY_V0.1.md) | Public tone + micro-proofs |
| [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](MANIFESTO_DISTRIBUTION_PACK_V0.1.md) | §4 Sovereign Nodes · §5 Anchored Reality |
| [`GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md`](../apps/client/docs/GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md) | Nisa / ops technical path |

---

*Friends anchor state; the world sees protocol discipline; core stays frozen. Nodes are coordinates + traces — not cast members.*
