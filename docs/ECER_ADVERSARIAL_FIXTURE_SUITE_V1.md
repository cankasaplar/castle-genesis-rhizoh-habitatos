# ECER-ADVERSARIAL FIXTURE SUITE v1

**Rol:** [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) / ECER kapalı boru hattının **sınır davranışını** ölçen, **coverage completeness** için normatif senaryo sınıfları. Her sınıf: `classifyDivergence` girdisi → `resolveVClass` beklenen eylem → **gate** (RBL / PAG / πEFC) çıktısı.

**Sürüm:** ECER-ADV-1  
**Durum:** `NORMATIVE_TARGET` — referans koşucu: [`scripts/ecerAdversarialSuite.mjs`](../scripts/ecerAdversarialSuite.mjs) · fixture tanımları: [`scripts/fixtures/ecer-adversarial/scenarios.mjs`](../scripts/fixtures/ecer-adversarial/scenarios.mjs)  
**İlişkili:** [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [RBL-D1](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) · [**ADV v1.1 (meta + eksen completeness)**](ECER_ADVERSARIAL_META_ADV_1_1.md) · [**LOOP-1 (öz-üretim döngüsü)**](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) · [**EBL-1.1 (epistemic budget)**](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) · [MK-1 §10](MK1_KERNEL_VALIDATOR_V0_1.md) · [piEMS-1 §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)

---

## 0. İlke

- **UNDEFINED davranış yok:** her senaryo ya kapalı **ret kodu** ya da kapalı **decision class** üretir.  
- **Fixture reality drift** riskine karşı: senaryo **üçlü** (classify → resolve → runtime gate) ile kilitlenir; yalnızca “doğru his” değil, **assert edilebilir** çıktı.

---

## 1. Senaryo sınıfları (minimum beş)

| Sınıf | Kısa anlam | classify girdisi (örnek) | `DIVERGENCE_CLASS` | `RESOLUTION_ACTION` (default tablo) | Runtime gate / beklenen |
|--------|-------------|--------------------------|--------------------|-------------------------------------|-------------------------|
| **DUAL_READ_CONFLICT** | CUT_OVER / dual-read penceresinde τ, yetkili epoch’a tanık taşımıyor | `epochFork: true`, `epochA`, `epochB` | `EPOCH_FORK` | `SUNSET` | πEFC: `MK1_ERR_DUAL_READ_WITNESS_MISSING` · `DECISION_REJECT_UNDEFINED_POLICY` |
| **AUTHORITY_SPLIT_TEMPORAL** | Aynı π çağrısında yayımlanmış bundle epoch’u ile bağlam epoch’u çakışıyor | `witnessRelation: "EXCLUSIVE"`, `epochA`, `epochB` | `W_EXCLUSIVE` | `NO_COLLAPSE` | PAG: `PAG_ERR_EPOCH_SCOPE_MISMATCH` |
| **MALICIOUS_BUNDLE_INJECTION** | Geçersiz / taşınmış authority artefaktı | (yok → `UNKNOWN`) veya `piSplitClass: "INCOMPARABLE"` | `UNKNOWN` / `PI_SPLIT_INCOMPARABLE` | `REJECT` | PAG: `PAG_ERR_INVALID_BUNDLE` veya RBL-A: `RBL_A_ERR_AUTHORITY_DRIFT` |
| **EPOCH_BACKWARD_REPLAY** | τ eski epoch’ta; yetki yeni epoch’ta; matris **NON_BREAKING** köprü | `piSplitClass: "NON_BREAKING"`, `epochA: "E0"`, `epochB: "E1"` | `PI_SPLIT_NON_BREAKING` | `SELECT` | πEFC: `DECISION_ACCEPT_NON_BREAKING` · uyumluluk `NON_BREAKING` |
| **WITNESS_COLLAPSE** | Konsensüs tanığı yok — mührlenemez tarih | `witnessRelation: "VOID"` | `W_VOID` | `REJECT` | RBL: `RBL_ERR_WITNESSLESS` (πEFC öncesi; bind yok) |

**Not (WITNESS_COLLAPSE):** Bu sınıfın doğal kapısı **witness mührü**dır; τ üretilmeden πEFC’ye düşülmez. Suite, classify/resolve ile **politika yönlendirmesini** ve RBL **explicit ret**’i birlikte sabitler.

---

## 2. Boru hattı özeti

```text
authority → validate (PAG / RBL-A1)
divergence → classify (D1)
policy → resolve (R1)
decision → evaluateBindIndexed (πEFC)
```

Adversarial suite, **hangi katmanda** kırılmanın beklendiğini senaryo tanımında açık yazar (`gate: "RBL" | "PAG" | "PIEFC"`).

---

## 3. Sonraki genişleme (ADV v1.1 — meta-generator)

**Normatif devam:** [ECER_ADVERSARIAL_META_ADV_1_1.md](ECER_ADVERSARIAL_META_ADV_1_1.md) — *türetilmiş* adversary, **D1 ∘ R1 ∘ A1** bileşimi, kontrollü witness/epoch/authority perturbasyonları ve **eksen-temelli adversarial completeness** ölçütü (`𝒟 × {W,A,E}`).

Sabit senaryo listesine ek örnek aileler (üreteçte hedeflenir): Guardian freeze + constitutional witness (PAG-I6); dissent-preserving replay; ikinci bundle **sessiz birleşme** yasağı; kötü niyetli `bundleHash` + geçerli şekil (drift alt türleri).

---

**Mühür (ECER-ADV-1):**

> **A correct epistemic runtime is measured by its adversarial circumference, not its happy path.**

---

*ECER-ADVERSARIAL FIXTURE SUITE v1 — five scenario classes; classify → resolve → gated outcome.*
