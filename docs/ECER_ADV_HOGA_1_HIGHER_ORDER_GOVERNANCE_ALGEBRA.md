# ECER-ADV — HOGA-1 Higher-Order Governance Algebra

**Üst isim (eş anlamlı):** **Laws about law evolution consistency** — kural evriminin **bileşimine** dair normatif cebir: iki (veya daha çok) **rule change** birbirini **çürütür**, **sıraya duyar** hale getirir veya **kapalı** bir üst uzayda kalır.

**Rol:** [TTA-1.1](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md) **ETK-2** ve **ECPT** (`𝒢_phase`), tekil `MetaΔ` ve faz kenarlarını bağlar. **HOGA-1**, şu derin soruyu adresler:

> **MetaΔ bileşimi tutarlı mıdır?** İki kural değişimi ardışık uygulanınca Θ (ve dolayısıyla birinci mertebe `𝒯`) **çelişkili** veya **tanımsız** hale gelir mi?  
> **ECPT bileşimi kapalı mıdır?** `φ₀ → φ₁ → φ₂` yolu, her parça `ℰ` içindeyken, birleşik yol da **her zaman** izinli midir — yoksa **gizli engel** var mıdır?

**Sürüm:** ECER-ADV-HOGA-1  
**Durum:** `NORMATIVE_TARGET` — doğrulayıcı çekirdek: [`scripts/hogaComposition.mjs`](../scripts/hogaComposition.mjs) — `npm run epistemic:hoga-verify` · MK-1 stress `hoga*` sütunları.  
**Önkoşul:** [TTA-1.1](ECER_ADV_TTA_1_1_TRANSITION_ALGEBRA_CLOSURE.md) · [TTA-1](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)

---

## 0. Problem: MetaΔ composition consistency

| Nesne | Risk |
|--------|------|
| `MetaΔ_a`, `MetaΔ_b` | Ardışık uygulama **sıraya bağlı**: `Θ₂ = apply(apply(Θ₀, MetaΔ_a), MetaΔ_b)` vs ters sıra **farklı** veya biri **fail** |
| Aynı Θ üzerinde “görünüşte bağımsız” iki patch | Birinin açtığı `𝒯_meta` yolu diğerini **anlamsız** kılar (ör. biri sıkılaştırırken diğeri aynı anda gevşetir) |
| **ECPT** üzerinde iki kenar | `φ₀→φ₁` ve `φ₁→φ₂` meşru iken, **bileşik faz yörüngesi** için öngörülmeyen **ara durum** veya **yasak ara Θ** |

**Sonuç:** İkinci mertebe tek başına **yeterli değil**; **üçüncü mertebe** (meta-meta) değil — **aynı mertebede bileşim cebiri** gerekir: HOGA-1.

---

## 1. HOGA taşıyıcıları (taslak)

| Taşıyıcı | Anlam |
|----------|--------|
| **CompositeMetaΔ** | `(MetaΔ_a, MetaΔ_b, …)` sıralı veya etiketli bileşim; sıra **normatif alanın parçası**dır |
| **Composition witness** | Bileşimin meşruiyeti — PAG / CUT_OVER / çok-imzalı “bu sıra izinlidir” kaydı |
| **Conflict signature** | İki MetaΔ’nın **etkileşim sınıfı**: `COMMUTE`, `ORDER_SENSITIVE`, `INCOMPATIBLE`, `AMBIGUOUS` |
| **ECPT path certificate** | `φ₀→…→φₙ` için her adım `ℰ`’de + **HOGA-I*** ile ara Θ’lerin **feasibility** zinciri |

---

## 2. ECPT bileşim kapalılığı (taslak teorem yüzeyi)

**HOGA-1 hedefi (normatif iddia değil — tasarım hedefi):**

- Ya **`𝒢_phase` bileşim kapalıdır** — yani `ℰ` üzerinde tanımlı tüm yasal yolların birleşimi yeni bir yasal yol üretir —  
- Ya da **açıkça fail-closed**: kapalılık yoksa, bileşik yol yalnız **HOGA witness** veya **AMBIGUOUS** sınıfına düşer; sessiz kabul **yasak**.

**Kritik ayrım:** Graf kapalı değilse, sistem **“kapalıymış gibi”** davranmamalıdır (TTA / ETK ile aynı ahlak).

---

## 3. HOGA-I* (bileşim güvenliği — taslak)

**HOGA-I0:** `MetaΔ_a ∘ MetaΔ_b` tanımlanmadan önce **interaction class** bilinmiyorsa sonuç **ACCEPT** edilemez — **AMBIGUOUS** veya ret.

**HOGA-I1:** `INCOMPATIBLE` imzalı çiftler **hiçbir** witness ile “iyi niyetli” kabul edilemez (anti-dilution).

**HOGA-I2:** ECPT üzerinde izinli iki kenarın bileşimi, ara fazda **yasak bir Θ** üretiyorsa, bileşik geçiş **fail-closed** (gizli ara durum yok).

**HOGA-I3:** Bileşim değerlendirmesi **deterministik** ve **replay** edilebilir olmalıdır (TLOA / ledger / Θ mührü ile hizalı).

---

## 4. İlişki tablosu

| Katman | Soru |
|--------|------|
| TTA-1 / ETK-1 | Bu **Δ** izinli mi? |
| TTA-1.1 / ETK-2 | Bu **MetaΔ** ve **Θ** hareketi izinli mi? |
| **HOGA-1** | Bu **MetaΔ’ların bileşimi** ve **ECPT yolunun birleşimi** tutarlı mı? |

---

## 5. Repo (uygulama)

1. **`composeMetaDelta(metaA, metaB, ctx)`** — sıralı çift kayıtlı tablo; bilinmeyen çift ⇒ `AMBIGUOUS` + `HOGA_ERR_COMPOSITION_UNDEFINED`; `INCOMPATIBLE`; `ORDER_SENSITIVE` ⇒ `compositionWitnessRef` zorunlu (`HOGA_ERR_ORDER_SENSITIVE_UNWITNESSED`).  
2. **`verifyEcptPathClosed({ path, edges, forbiddenMiddles?, requiredClosureEdges? })`** — `FROM>TO` kenarları; isteğe bağlı **gizli ara faz** (`ECPT_HIDDEN_INTERMEDIATE`) ve **bileşik kapak** kenarı.  
3. **MK-1 stress:** `hoga*` sütunları — [§10](MK1_KERNEL_VALIDATOR_V0_1.md#10-mk-1-determinism-stress-harness-v01--poisoned-trace-suite).  
4. **Sonraki:** PAG **composition witness** şeması; genişletilmiş `𝒯_meta` tablosu; gerçek Θ coupling.

**Hata ailesi (taslak):** `HOGA_ERR_COMPOSITION_UNDEFINED`, `HOGA_ERR_META_INCOMPATIBLE`, `HOGA_ERR_ECPT_PATH_NOT_CLOSED`, `HOGA_ERR_ORDER_SENSITIVE_UNWITNESSED`.

---

**Mühür (HOGA-1):**

> **Two amendments may pass alone and fail together — unless algebra says otherwise.**

---

*ECER-ADV HOGA-1 — Higher-order governance algebra; MetaΔ composition; ECPT closure; laws about law-evolution consistency.*
