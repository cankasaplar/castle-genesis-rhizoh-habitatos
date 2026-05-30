# Rhizoh Activation Readiness Checklist v1.0

**SSOT gate** — tek doğruluk kaynağı. Mimari spec değişmez; sorun artık **operasyon onayı**.

| Layer | Status |
|-------|--------|
| Spec | ✔ complete (frozen) |
| Control-plane | ✔ static |
| Data-plane | ❌ closed |
| Ingress | ✔ testable, **inert** |
| Activation | ⏳ **manual READY** after checklist |
| Checklist | ✔ this document + `npm run activation:readiness-check` |

**Spine rule:** *Activation = ayrı switch, checklist sonrası* — DNS açık ≠ sistem çalışıyor.

```bash
npm run activation:readiness-check
```

Report: `docs/exports/ops/activation_readiness_v1.0.json`

---

## 0. Operasyonel karar (insan gate — teknik değil)

| Decision | Meaning |
|----------|---------|
| **READY** | Tüm MANUAL doğrulandı; AUTO yeşil; staging’de sinyal açılabilir |
| **HOLD** | Eksik bağımlılık veya hukuk/ops belirsizliği; switch kapalı kalır |

Record: copy [`docs/ops/activation_decision_LOG.template.json`](ops/activation_decision_LOG.template.json) → `docs/exports/ops/activation_decision_YYYY-MM-DD.json`

Fields: `decision` (`READY` \| `HOLD`) · `signedBy` · `date` · `notes`

**NO-GO:** `HOLD` veya imzasız READY.

---

## 1. MANUAL — gerçek dünya dependency

Her madde: **kanıt komutu** + checkbox.

### A1 — DNS gerçekten proxied?

- [ ] NS authoritative → edge (Cloudflare)

```bash
dig NS rhizoh.com +short
```

- [ ] `A`/`AAAA` proxied; origin IP **not** in public DNS leak tools

```bash
dig A rhizoh.com +short
```

- [ ] Registrar transfer lock on

Ref: [`INFRASTRUCTURE_DNS_HARDENING_V0.1.md`](INFRASTRUCTURE_DNS_HARDENING_V0.1.md)

### A2 — TLS valid?

- [ ] HTTPS responds; cert chain valid

```bash
curl -sI https://rhizoh.com | head -5
```

- [ ] Cloudflare SSL mode **Full (strict)** (dashboard check)
- [ ] HTTP → HTTPS redirect works

### A3 — Legal

- [x] Entity SSOT — Can Kasaplar, Serencebey Yokuşu 13/2 Beşiktaş, cankasaplar@gmail.com
- [ ] [`COUNSEL_PASS_CHECKLIST_V1.0.md`](legal/COUNSEL_PASS_CHECKLIST_V1.0.md) tamamlandı
- [ ] [`ACTIVATION_READY_HOLD_DECISION_V1.0.md`](ops/ACTIVATION_READY_HOLD_DECISION_V1.0.md) imzalandı

### A4 — Firebase / hosting gerçekten read-only?

- [ ] Deploy = static ingress + rules reviewed
- [ ] **No** client write to heartbeat/telemetry paths
- [ ] Firestore rules: no `allow write: if true` on open collections

```bash
# Review before deploy
cat firestore.rules
```

### A5 — Ingress route gerçekten inert?

- [ ] Site loads legal preamble (or app if acked); no silent bypass
- [ ] `VITE_RHIZOH_LEGAL_PREAMBLE=1` smoke on staging host
- [ ] Browser: session ack → refresh → still deterministic route

### A6 — UI yalnızca read-only / decision gate?

- [ ] No sliders / scores on cohort screen
- [ ] Cohort = accept/decline only (`completeCohortGateNoOpV0`)
- [ ] No product behavior driven by logs

### A8 — Cohort sim (ops input)

- [ ] `npm run legal:go-live-cohort-sim` — decision `proceed` \| `hold` \| `abort` filed in ops export

### A9 — Surface ≠ activation (team ack)

- [ ] DNS/TLS live does **not** mean data-plane live
- [ ] Ops understands: **READY** is human gate, not AUTO alone

---

## 2. AUTO — repo checks

| ID | Check |
|----|--------|
| R1 | Ingress tests |
| R2 | Passive coherence |
| R3 | `VITE_RHIZOH_PHASE1_SIGNAL` ≠ `1` in tracked env |
| R4 | Fallback `fallbackCarriesState: false` |
| R5 | Cohort UI no-op (no engine on UI path) |
| R6 | No heartbeat route in `apps/gateway` |
| R7 | Legal preamble SSOT |
| R9 | **Single switch SSOT** — `phase1ActivationGateV0.js` only |

---

## 3. Activation switch (tek nokta)

**Only** read `VITE_RHIZOH_PHASE1_SIGNAL` in:

`apps/client/src/rhizoh/ingress/phase1ActivationGateV0.js`

```js
isDataPlaneActiveV0()  // true only when env = 1
isIngressRuntimeInertV0()  // default true
```

No subsystem may override. Future heartbeat client/gateway must call `isDataPlaneActiveV0()` only.

**Turn on (after READY + enforcement code for Phase 1):**

1. Staging: `VITE_RHIZOH_PHASE1_SIGNAL=1`
2. Re-run `npm run activation:readiness-check`
3. WAL/ledger isolation smoke (I1–I6)

---

## NO-GO summary

- Any AUTO fail
- Any required MANUAL unchecked
- READY without signed ops log
- DNS “live” treated as activation

---

*Checklist SSOT v1.0 — operasyon protokolü*
