# Edge Case Survival Kit v1.0

**Tag:** `CORE-ELIGIBLE` · **Ops + support SSOT**  
**Purpose:** Expected behavior and recovery for corrupted storage, long offline, and identity mismatch — without pretending RCML is oracle truth.

| Related | |
|---------|--|
| RCML / persistence | [`RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md`](./RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md) |
| Final four gaps | [`PRODUCT_LAUNCH_GAP_FINAL_FOUR_V1.0.md`](./PRODUCT_LAUNCH_GAP_FINAL_FOUR_V1.0.md) §3 |
| Tests (patterns) | `apps/client/src/rhizoh/experience/__tests__/*` · `clear*ForTestV0` helpers |

---

## 1. Corrupted storage (`sessionStorage` / `localStorage`)

### Symptoms

- Blank continuity, throws in console on `JSON.parse`, FTUE repeats every load, mutation ledger “stuck.”

### Keys involved (prefixes — do not treat as API)

| Store | Prefix / pattern (examples) |
|-------|-------------------------------|
| session | `rhizoh.world_instance.v0`, `rhizoh.world_mutation.v0:*`, `rhizoh.living_world.persistence.v0:*`, `rhizoh.drift.entropy_budget.v0:*`, `rhizoh.entropy.session_fatigue.v0:*` |
| local | `rhizoh.self_signature.v0`, `rhizoh.entropy.economy.v0:*` (per `self_*`), `rhizoh.cross_session.coherence.v0:*` (per world instance id) |

### Recovery (user-safe order)

1. **Soft:** Site settings → clear site data for **this origin only** (user education copy: “Rhizoh bu cihazdaki yerel hafızayı sıfırlar; hesabın sunucu tarafını silmez.”).
2. **Support script (dev):** Remove keys matching `^rhizoh\.` in Application → Storage (document in internal runbook only).
3. **After clear:** New `self_*` may mint — continuity copy may say “first breath” again (expected).

### Product copy (HEL)

Prefer: *“Yerel hafıza okunamadı — temiz bir nefesle devam ediyoruz.”* (implement in HEL when `parse*` fails — future hook).

---

## 2. Offline ~7 days (and long idle)

### What still works

- Shell loads; static **HEL** + **RCML** copy can render from last in-memory frame if any (usually cold start).

### What degrades

- **RLL-O / gateway:** no tick → atmosphere ribbon may stall or show neutral; **not** a user fault.
- **Entropy economy:** time-based recharge in `perceptualEntropyEconomyV0` — **long absence increases remaining budget** (see module); fatigue may decay via idle time.
- **Cross-session coherence:** `hydrateCrossSessionCoherenceV0` uses gap from anchor / last visit — **7+ days** triggers long-gap blend path when returning.

### Expected UX

- User sees *“Uzun aradan sonra…”* class copy (coherence) + possible **FTUE off** (returning visit).
- No infinite spinner: surface must fail **closed** (no fake live data).

### Ops

- Document max client clock skew; if device clock wrong, coherence lines may read odd — support: “check system time.”

---

## 3. Identity mismatch (`self_*` vs session / world instance)

### Definitions

| Identity | Storage | Role |
|----------|---------|------|
| **User / self** | `localStorage` `rhizoh.self_signature.v0` | Stable `self_*` for entropy economy binding |
| **Session / world instance** | `sessionStorage` `rhizoh.world_instance.v0` | Tab bucket `wi_*` |

### Mismatch scenarios

| Scenario | Behavior |
|----------|----------|
| User clears **session** only | New `wi_*` for tab; **same** `self_*` → entropy ledger continues on self key; world mutation ledger **resets** for new instance id (expected). |
| User clears **local** only | New `self_*`; session may still hold old `wi_*` → **felt** continuity may feel “new user, old tab” until full reload; rare. |
| User clears **both** | Clean slate — FTUE on, new self + new world instance. |

### Support guidance

- “İki farklı hafıza katmanı var: tarayıcı sekmesi (kısa) ve cihaz (uzun). Birini silmek diğerini silmez.”
- Do **not** promise server-side merge without product that exists (see Academy / real connection SSOT).

**Implementation touchpoints:** `worldInstanceFromLocationSeedV0.js`, `identityDriftBindingV0.js`, `perceptualEntropyEconomyV0.js`, `worldDriftCalibrationV0.js`, `crossSessionWorldCoherenceV0.js`, `livingWorldPersistenceUxV0.js`, `worldMutationFeedbackV0.js`.

---

## 4. Quick verification commands (dev)

```bash
npm run rcml:validate-freeze-contract
npm run spiral:validate-rhizoh-boundary
npm test -w apps/client -- src/rhizoh/experience/__tests__/
```

---

## 5. Change policy

Add a row here when a **new** browser persistence key ships in RCML/HEL adjacent modules.

---

*v1.0 — edge survival SSOT.*
