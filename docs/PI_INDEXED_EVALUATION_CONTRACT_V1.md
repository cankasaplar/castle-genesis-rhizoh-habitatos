# π-Indexed Evaluation Function Contract (piEFC-1)

**Rol:** **Tek runtime yüzeyi** üzerinde **binding değerlendirme + MK-1 kabul + uyumluluk sınıfı** birleşir. Bu olmadan **MK-1** bağımsız kalır, **Compat-1** analitik kalır; **runtime birleşik karar** üretemez (operasyon tek `evaluateBind` çağrısında “geçer mi, hangi π-altında, matris ne diyor?” göremez).

**Operatör notasyonu:** **πEFC** = **epoch-indexed deterministic evaluation operator** — truth üretmez; **decision consistency** üretir ([`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §1–2).

```text
πEFC : (τ, π, epoch, clock) → (mk1Result, compatibilityClass)
```

**Sürüm:** piEFC-1  
**Durum:** `NORMATIVE_TARGET` — imza aşağıda; referans implementasyon EBVM + `mk1Validate` üzerinde birleştirilecek.  
**Formal runtime spec:** [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) (determinism, memoization, partial eval, replay, sovereign D, non-self-validation, §7 teoremler, Execution Algebra eşiği).  
**İlişkili:** [`PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md`](PCEK_1_BOOTABLE_KERNEL_MILESTONE_V1.md) (PCEK-1) · [`PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md`](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) (PAG-1) · [**CGR-1**](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) (fail-closed PAG gate + governable runtime) · [**RBL-1**](RBL_1_REALITY_BRIDGE_LAYER_V1.md) (world → `WitnessArtifact`) · [**RBL-τ Binding**](RBL_TAU_BINDING_LAYER_V1.md) (artefakt → τ, π-context bijeksiyon) · [**RBL-τ Lineage**](RBL_TAU_LINEAGE_LAYER_V1.md) · [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) · [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md) (EBVM, `evaluateBind` / VM) · [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) (MK-1) · [**ECER-ADV-1**](ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md) (adversarial fixture suite) · [**ECER-ADV-META-1.1**](ECER_ADVERSARIAL_META_ADV_1_1.md) (axis completeness) · [**ECER-ADV-LOOP-1**](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) (EGK / SCG / MCE · OSR · GPF) · [**ECER-ADV-EBL-1.1**](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) (ERGS / epistemic budget) · [**EBE-1**](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md) (β evolution · EBE-I0) · [**ECDM-1**](ECER_ADV_CONSTITUTION_DRIFT_MONITOR_ECDM_V1.md) (constitution drift) · [**TLS-1.1**](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) (EBE–EBL–ECDM equilibrium) · [**TLOA-1**](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) (tri-layer snapshot) · [**TTA-1**](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) (snapshot transition) · [**TTA-1.1**](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md) (meta-transition / TACS) · [**HOGA-1**](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) (MetaΔ bileşimi) · [`PI_EMS_COMPAT_MATRIX_V1.md`](PI_EMS_COMPAT_MATRIX_V1.md) (M[i,j]) · [`PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md`](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) (epoch, CUT_OVER) · [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) (clock)

---

## 1. Normatif imza

**π-indexed evaluation** (kavramsal birleşik fonksiyon) — kısaca:

```text
evaluateBind(τ, π, epoch, clock) → EvaluationOutcome
```

Uygulamada çakışmayı önlemek için tam isim **`evaluateBindIndexed`**; anlam aynıdır: **π** = `π_authority`, **epoch** = `epoch_ctx`.

| Parametre | Anlam |
|-----------|--------|
| **τ** | **Trace** (veya EBVM çıktısına indirgenebilir kanon artefakt) — üzerinde `piHash_trace` / `projectionEpochId` bağlamı taşımalıdır ([piEMS §4.3](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)). |
| **π_authority** | Bu çağrıda **yetkili** projeksiyon sözleşmesi — `piHash` veya eşdeğer; MK-1 **bu π** ile range kontrolü yapar ([Compat-1 §4](PI_EMS_COMPAT_MATRIX_V1.md)). |
| **epoch_ctx** | **Projection epoch** bağlamı: τ’nin üretim epoch’u ile authority epoch’u **ayırt** etmek için (ör. `epoch_trace`, `epoch_engine` veya tek `projectionEpochId` + manifest). |
| **clock** | GDK clock nesnesi — MK-1 `checkClock` ile uyumlu ([`MK1` §3](MK1_KERNEL_VALIDATOR_V0_1.md)). |

**Not:** Günlük isim `evaluateBind`; **piEFC** bunun **π ve epoch açık parametreli** genişlemesidir — salt CSB sonucu değil, **PCEK kapanışı**.

**MK-1 köprüsü (implementasyon):** `mk1Validate(trace, { manifest, clock, piAuthority?, epochContext?, compatibilityMatrix? })` → `{ mk1, compatibility, decisionClass, witness?, piEfcCode? }` — `decisionClass` **yalnız** `DECISION_CLASS` frozen enum’undan ([`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §9.8, [`mk1Validate.mjs`](../scripts/mk1Validate.mjs)).

**Sovereign yüzey:** [`evaluateBindIndexed.mjs`](../scripts/evaluateBindIndexed.mjs) — `evaluateBindIndexed(τ, π_authority, epoch_ctx, clock_ctx, manifest [, compatibilityMatrix [, authorityBundle]])`. Opsiyonel **`authorityBundle`** ([PAG-1 §4](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md), [`authorityBundle.mjs`](../scripts/authorityBundle.mjs)) verildiğinde sıra: **şekil** (`isAuthorityBundleShape`) → **`bundle.piHash === π_authority`** → **`bundle.epochId === epoch_ctx.id` veya `authorityEpochId`**; aksi halde `piEfcCode` ∈ `PAG_ERR_*` ve πEFC matris katmanına girilmez.

---

## 2. Çıktı: `EvaluationOutcome`

```text
EvaluationOutcome = {
  mk1:        MK1Result,           // yapısal MK-1 sonucu
  compatibility: CompatibilityClass,
  decisionClass: DecisionClass,    // decisionClass ∈ D — yalnız DECISION_CLASS.* ([§9.8](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md))
  witness?:   string,
  piEfcCode?: string,            // MK1_ERR_* (πEFC) veya PAG_ERR_* (bundle ön kapı)
  matrixRef?: string              // hangi M artefaktı / sürüm (opsiyonel audit)
}
```

### 2.1 `MK1Result`

[`mk1Validate`](MK1_KERNEL_VALIDATOR_V0_1.md) ile aynı sınıf: `valid`, `class` (`MK1_VALID_TRACE` / …), `witness?`, `code?` (`MK1_ERR_*`). Üst seviye `piEfcCode` alanı ayrıca **PAG ön kapı** hatalarını taşıyabilir (`PAG_ERR_*`, [`authorityBundle.mjs`](../scripts/authorityBundle.mjs)).

### 2.2 `CompatibilityClass`

**τ’nin bağlı olduğu epoch** (kaynak) ile **π_authority** (hedef yetki) arasındaki hücre:

**compatibility := M[epoch_trace, epoch_authority]**

| Değer | Anlam (Compat-1 ile uyumlu) |
|--------|------------------------------|
| **SELF** | `epoch_trace` ≡ `epoch_authority` (veya aynı `piHash`) — matris köşegen. |
| **NON_BREAKING** | M[i,j] = NON_BREAKING |
| **BREAKING** | M[i,j] = BREAKING |
| **INCOMPARABLE** | M[i,j] = INCOMPARABLE |
| **UNDEFINED** | Matris yok / τ’de epoch eksik — **birleşik karar yok**; üretim pipeline’ı **durdurur** veya explicit hata (sessiz varsayılan yok). |

**Kural:** `compatibility = INCOMPARABLE` iken `mk1.valid === true` **üretim anlamında** kullanılmamalı (archival mod ayrı bayrak).

### 2.3 `DecisionClass` (frozen **D**)

Bkz. [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §9.8 — runtime **closure**; yeni değer yasak.

---

## 3. Birleşik karar (runtime)

Tek çağrıda operasyon şunları **atomik** görür:

1. **MK-1** sonucu — trace bu π altında range’de mi?  
2. **Uyumluluk sınıfı** — τ bu authority ile **politik olarak** taşınabilir mi? ([Compat-1](PI_EMS_COMPAT_MATRIX_V1.md))  
3. CUT_OVER / dual-read: [piEMS §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) — `π_authority` ile `piHash_trace` sessizce çakıştırılmaz.

**Olmadan:** üç ayrı araç (VM, validator, spreadsheet) — **aynı input farklı görünür**; Epistemic OS **tek runtime yüzeyi** eksik kalır.

---

## 4. İlişki EBVM ↔ MK-1 ↔ Compat

| Bileşen | piEFC öncesi | piEFC ile |
|---------|----------------|-----------|
| **EBVM** | τ üretir | τ üretir; **epoch etiketi** zorunlu hale gelir |
| **MK-1** | Bağımsız `mk1Validate` | `EvaluationOutcome.mk1` |
| **Compat-1** | Analitik M tablosu | `EvaluationOutcome.compatibility` |
| **Runtime** | Birleşik karar yok | **Tek outcome** |

---

## 5. Determinizm

Aynı `(τ, π_authority, epoch_ctx, clock, M)` → **aynı** `EvaluationOutcome` — **contextual determinism** (π + epoch + clock genişletilmiş bağlam); ayrıntı [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §2.1, §7.

---

## 6. Sonraki adımlar (repo)

1. `evaluateBind.mjs` / pipeline: **π + epoch** parametreleri ve `EvaluationOutcome` şekli.  
2. MK-1: opsiyonel `piHash` / epoch mismatch ret kodu (MK-1.1).  
3. Compat-1: **M** artefaktını yükleme + `UNDEFINED` davranışı testleri.  
4. [πEFC-Runtime-1.0](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) §7 teoremleri + **Execution Algebra** belgesi.

---

*piEFC-1 — π-Indexed Evaluation Function Contract; unified runtime decision surface.*
