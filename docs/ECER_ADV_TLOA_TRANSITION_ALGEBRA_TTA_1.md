# ECER-ADV — TLOA Transition Algebra (TTA-1) — yönlendirme

**Rol:** [TLOA-1](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) **bir anı** mühürler; **TTA-1** (TLOA-2 / sonraki sınır) **iki an arasındaki meşru dönüşüm**u normatif bağlar. Bugün: snapshot var; **snapshot’lar arası hukuk** çoğunlukla **örtük**. TTA-1 hedefi: **legal diff** (iki `snapshotContentDigest` arası), **izinli dönüşüm kuralları** ve *“iki gerçeklik arasında hangi transformasyonlar meşrudur?”* sorusunun **kapalı cebir**i.

**Sürüm:** ECER-ADV-TTA-1  
**Durum:** `NORMATIVE_TARGET` — **ETK-1** çekirdeği repo’da; cebir bileşimi ve geniş `𝒯` **TTA-1.1** ile büyür.  
**Referans kod (ETK-1):** [`scripts/ecerEpistemicTransitionKernel.mjs`](../scripts/ecerEpistemicTransitionKernel.mjs) — `npm run epistemic:etk-verify` · giriş takma adı: [`scripts/ecerTloaTransitionReport.mjs`](../scripts/ecerTloaTransitionReport.mjs) (`npm run epistemic:tta-verify`)  
**Önkoşul:** [TLOA-1](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) · [TLS-1.1](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md) · [piEMS-1 §4](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) (epoch / CUT_OVER) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md)  
**Sonraki:** [**TTA-1.1 — TACS / EPSC**](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md) (ikinci mertebe · ETK-2) · [**HOGA-1**](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) (MetaΔ bileşim tutarlılığı · ECPT kapalılığı)

---

## 0. Problem: snapshot’lar arası boşluk

| Var | Yok |
|-----|-----|
| `S₀`, `S₁` TLOA snapshot’ları | İkisini bağlayan **açık** `S₀ → S₁` kural kümesi |
| `digest(S₀) ≠ digest(S₁)` | **Meşru** diff cebiri: hangi alan değişimi hangi gate’i gerektirir |

**Sonuç:** Zaman yalnız **gözlenen** değil; **yönetilen** epistemik evrim için geçişler **tanımlanmalıdır**.

---

## 1. Hedef nesneler (taslak)

| Nesne | Anlam |
|--------|--------|
| **Epistemic diff** | `Δ(S₀, S₁)` — yapılandırılmış fark (ebe / ebl / ecdm / closure alt alanları). |
| **Transition witness** | `Δ`’nin meşruiyeti için PAG / ECDM / triangulation kaydı. |
| **Allowed transform set** | Kapalı küme `𝒯` — hangi `Δ` türleri **önkoşulsuz**, hangileri **CUT_OVER / amendment** gerektirir. |

---

## 2. TTA-I0 (taslak güvenlik)

**TTA-I0:** Hiçbir `S₀ → S₁` geçişi, **ECDM = CONSTITUTIONAL_DRIFT** veya **PAG freeze** altında **transition witness** olmadan **otomatik kabul** edilemez.

**TTA-I1:** `digest(S₀) = digest(S₁)` ⇒ **trivial transition** (no-op); aksi trivial iddiası **replay** ile kanıtlanır.

---

## 3. İlişki: epistemic diff algebra

- **Cebir:** İsteğe bağlı bileşim `Δ₂ ∘ Δ₁` (aynı zincirde ardışık adımlar) — birleşme **kapalı** tutulmalı veya **AMBIGUOUS**a düşmeli.  
- **Zaman:** [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) epoch geçişi ile TTA **hizalanır**; CUT_OVER = özel transition sınıfı.

---

## 4. ETK-1 — Epistemic Transition Kernel (uygulama çekirdeği)

TLOA-1 snapshot’ına kilitli **üçlü**:

| Bileşen | İşlev | Export (özet) |
|--------|--------|----------------|
| **Tri-layer semantic delta** | State transition fonksiyonu değil; EBE / EBL / ECDM / closure **projeksiyon** patch’leri | `epistemicDiff(S₀, S₁)` |
| **Transition legitimacy kernel** | PAG, ECDM toleransı, EBL feasibility, digest continuity, CUT_OVER witness — **epistemic admissibility predicate** | `evaluateTransitionAdmissibility(Δ, policy)` |
| **𝒯 kapanışı** | Kapalı geçiş uzayı: `TRIVIAL`, `EBL_LEDGER_SHIFT`, `EBE_POLICY_SHIFT`, `ECDM_SIGNAL_SHIFT`, `CLOSURE_REBAND`, `COMPOUND_REGULATED`, `CUT_OVER` | `TRANSITION_SPACE` + `diff.transitionSpaceKind` |

**Doğrulama + sınıflandırma + ledger satırı:** `verifyEpistemicTransition(S₀, S₁, policy)` → `{ diff, admissibility, ledgerEntry }`; kalıcı zincir için `appendTransitionLedger(ledger, ledgerEntry)`.

**Sınıflandırma:** `VALID` \| `PARTIAL` \| `ILLEGAL` \| `DRIFTED` (`TRANSITION_CLASSIFICATION`).

**Hata sınıfları:** `TTA_ERR_ILLEGAL_TRANSITION`, `TTA_ERR_DRIFT_UNBOUNDED`, `TTA_ERR_ECDM_BYPASS`, `TTA_ERR_DIGEST_DISCONTINUITY`, `TTA_ERR_EBL_INFEASIBLE`, `TTA_ERR_PAG_CONSTRAINT` (`TTA_ERR`).

**MK-1 stress:** [§10](MK1_KERNEL_VALIDATOR_V0_1.md#10-mk-1-determinism-stress-harness-v01--poisoned-trace-suite) — `tta*` sütunları: snapshot’lar **arası** geçiş doğruluğu (TLOA digest trivial, PAG, ECDM bypass, ledger seq).

**TTA-1.1:** [Transition Algebra Closure System (TACS) / Epistemic Phase Space Completion (EPSC)](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md) — birinci mertebe bileşim (`Δ₂ ∘ Δ₁`) + **ikinci mertebe** `ETK(Δ₁) ↦ Δ₂` / `MetaΔ`; `𝒯_meta`, Θ-mühür, meta-admissibility. **ETK-2** = Θ-dynamics **coupling** + **meta-governance kernel** + **epistemic constitutional phase transitions** (ECPT) — belgede **§5**.

**HOGA-1:** [Higher-Order Governance Algebra](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) — `MetaΔ ∘ MetaΔ` tutarlılığı, ECPT yollarının **bileşim kapalılığı**, *laws about law evolution consistency*.

---

**Mühür (TTA-1):**

> **Between two realities lies not a gap but a rule — or there is no passage.**

---

*ECER-ADV TTA-1 — TLOA transition algebra; legal diffs; managed epistemic time.*
