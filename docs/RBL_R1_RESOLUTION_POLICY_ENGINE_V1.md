# RBL-R1 — Resolution Policy Engine v1

**Rol:** [RBL-D1](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) **sınıflandırır**; **çözüm** (hangi τ üretimde seçilir, geçersiz olan nasıl ayrılır, uzlaşma nasıl mühürlenir ve arşivlenir) **RBL-R1** ile normatif hale gelir. D1 olmadan çatışma adı yok; **R1 olmadan eylem politikası yok**.

**Sürüm:** RBL-R1  
**Durum:** `NORMATIVE_TARGET` — policy spec; runtime `RBL_RES_*` / `resolveDivergence` **sonraki faz**.  
**Önkoşul:** [RBL-D1](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [RBL-τ Lineage](RBL_TAU_LINEAGE_LAYER_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)  
**İlişkili:** [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) · [CGR-1](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) · [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) (kim bağlar / epoch / split) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) (GCS / drift / boundary sync)

---

## 0. D1 → R1 ayrımı

| Katman | Soru |
|--------|------|
| **RBL-D1** | Bu divergence **hangi sınıfa** (V-CLASS-I / II / III) girer? |
| **RBL-R1** | Bu sınıf için **izin verilen eylem** nedir — seçim, ayırma, birleştirme kaydı, arşiv? |

**Yasak:** Sınıf etiketi olmadan “merge” veya “archive” — fail-closed.

---

## 1. V-CLASS-I — çözüm: çoğullukta **seçim**, kimlik **birleştirme değil**

**Durum:** İkisi de yapısal olarak meşru (contextual determinism); **farklı `finalHash`** kasıtlı.

**“Nasıl çözülür?”** Burada çözüm = **tek gerçekliğe indirgeme değil** — **üretim / yargı bağlamında açık seçim politikası**:

| Politika (normatif hedef) | Anlam |
|---------------------------|--------|
| **R1-I-SELECT** | Belirli bir τ, **ProjectionAuthorityBundle** + πEFC çağrısında **yetkili çözüm** olarak seçilir; diğeri **reddedilmez**, ledger’da kalır. |
| **R1-I-PARALLEL** | İkisi de **read-only / audit** yollarında eşzamanlı geçerli; üretim hattı yalnız biriyle bağlanır (EMCS / operatör politikası). |
| **R1-I-NO-COLLAPSE** | **Hash birleştirme** veya `finalHash` üzerinden **sessiz birleştirme yasak** (RTBL-I4 ile uyumlu). |

**Sonuç:** V-CLASS-I “merge edilmez” — **ayırtılmış kimlikler korunur**; “resolution” = **hangi lineage’in hangi kapıdan geçtiğinin** mührü ([PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) kapsamı).

---

## 2. V-CLASS-II — çözüm: **ayırtma** (merge = geçerli + kayıt)

**Durum:** Biri veya ikisi **mühür / governance / seal** ihlali; veya W-VOID.

**“Nasıl merge edilir?”** Burada **merge** = **yalnızca geçerli τ (veya artefakt) zincirine izin verilen bileşim** — **özdeşlik birleştirmesi değil**:

| Adım | İfade |
|------|--------|
| **R1-II-REJECT** | Geçersiz τ **üretimde kullanılamaz**; MK-1 / πEFC zaten ret veya `UNDEFINED` üretebilir. |
| **R1-II-QUARANTINE** | Şüpheli τ **ayrı ledger namespace** veya `resolutionState: QUARANTINED` (şema RBL-R1.1). |
| **R1-II-MERGE-RECORD** | Geçerli taraf **append-only** kalır; geçersiz taraf **silinmez** — PAG **minority / dissent** hattına düşer ([DISSENT_CAPTURE](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md)). |
| **R1-II-NO-SQUASH** | Geçersizi geçerli hash içine **gömme** yok. |

**Sonuç:** “Merge” = **operasyonel birleşik ledger görünümü** değil; **tek meşru yol + ihlalin arşivlenmiş izi**.

---

## 3. V-CLASS-III — çözüm: **reconciliation → archive**

**Durum:** Açık **uzlaşma** gerekir (ör. yeni üst taahhüt, CUT_OVER, konsey kararı).

**“Nasıl archive edilir?”**

| Politika | İfade |
|----------|--------|
| **R1-III-RECONCILE** | Yeni **mühürlü** artefakt veya PAG **ProjectionAuthorityBundle** ile **yeni lineage kökü** (parent pointer’lar korunur). |
| **R1-III-ARCHIVE** | Önceki dallar **HISTORICAL_ARCHIVE** / piEMS **SUNSET** hizasında salt okunur; **overwrite yok**. |
| **R1-III-WITNESS** | Uzlaşma kararı **constitutional witness** üretir (PAG-I6 / freeze dışı normal akış). |
| **R1-III-DUAL-READ** | Geçiş penceresi [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) / [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) dual-read tanığı ile kapatılır. |

**Sonuç:** Archive = **tarihsel çözüm nesnesi** eklenir; eski τ’ler **kayıt altında** kalır.

---

## 4. Resolution invariants (RBL-R-I*)

| Kimlik | İfade |
|--------|--------|
| **RBL-R-I1** | **No resolution without D1 class** — V-CLASS atanmadan R1 eylemi yok. |
| **RBL-R-I2** | **No identity squash** — V-CLASS-I/II için `finalHash` **birleştirilerek** tekilleştirilmez. |
| **RBL-R-I3** | **Archive is append** — V-CLASS-III archive **yeni commitment** ile çarpar; eski silinmez. |
| **RBL-R-I4** | **Authority-bound selection** — V-CLASS-I üretim seçimi **PAG yetkisi** veya açık operatör politikası ile bağlı olmalı (sessiz seçim yok). |
| **RBL-R-I5** | **Dissent preserved** — R1-II reddi **dissent zincirinden** düşmeyebilir (PAG-I3). |

---

## 5. πEFC / MK-1 ile sıra

```text
classify (D1) → resolve (R1) → bind governance (G1) → evolve authority (A1) → evaluateBindIndexed / mk1Validate (judgment)
```

πEFC **DECISION_CLASS** üretim kararını taşır; R1 **hangi τ’nin o kapıya girdiğini** ve **çatışma sonrası ledger durumunu** politikalar; [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) **kimin** R1’i yürütebileceğini ve **epoch / split** altında politikayı bağlar; [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) **G1 kısıt sürümü**, **drift** ve **epoch–authority** sınır tutarlılığını sabitler.

---

## 6. Sonraki repo adımları

- `scripts/resolutionPolicy.mjs` (veya eşdeğer): `resolveVClass({ class, tauA, tauB, authorityBundle })` → `{ action, ledgerPatch }`.  
- Kapalı enum: `RBL_RES_ACTION_*` (SELECT, PARALLEL, REJECT, QUARANTINE, RECONCILE, ARCHIVE_BRANCH, …).  
- Stress: D1 sınıfı stub + R1 eylem tutarlılığı (henüz tam yargı yok).

---

## 7. Mühür (RBL-R1)

> **Class names the fork; policy names the move.**

---

*RBL-R1 — Resolution Policy Engine; V-CLASS-I selection, V-CLASS-II separation, V-CLASS-III reconciliation and archive.*
