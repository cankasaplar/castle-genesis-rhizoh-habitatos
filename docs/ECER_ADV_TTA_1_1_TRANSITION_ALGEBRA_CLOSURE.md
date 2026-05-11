# ECER-ADV — TTA-1.1 Transition Algebra Closure System (TACS)

**Üst isim (eş anlamlı):** **Epistemic Phase Space Completion (EPSC)** — geçiş cebirinin **ikinci mertebe**de kapanması: yalnız snapshot’lar arası değil, **geçişleri yargılayan kural uzayının** kendisinin izinli evrimi.

**Rol:** [TTA-1](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) birinci mertebede `S₀ → S₁` ve `Δ = epistemicDiff(S₀, S₁)` üzerinde **ETK-1** ile çalışır. **TTA-1.1**, şu soruyu normatif bağlar: *bir geçişin ETK çıktısından diğer bir geçiş kuralına/hükmine geçiş* — yani **ETK(Δ₁) ↦ Δ₂** veya kısaca **transition-of-transitions** — ne zaman meşrudur?

**Sürüm:** ECER-ADV-TTA-1.1 (TACS / EPSC)  
**Durum:** `NORMATIVE_TARGET` — kavram ve invariant’lar bu belgede; **ETK-1** birinci mertebe; **ETK-2** = Θ-dynamics + meta-governance (aşağı §5) uygulama sonrası.  
**Önkoşul:** [TTA-1](ECER_ADV_TLOA_TRANSITION_ALGEBRA_TTA_1.md) · [TLOA-1](ECER_ADV_TRILAYER_OBSERVABLE_ARTIFACT_TLOA_1.md) · [ETK-1 — `ecerEpistemicTransitionKernel.mjs`](../scripts/ecerEpistemicTransitionKernel.mjs) · [piEMS-1 §4](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md)  
**Sonraki (bileşim):** [**HOGA-1**](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) — MetaΔ bileşim tutarlılığı · ECPT kapalılığı · *laws about law evolution consistency*

---

## 0. Birinci vs ikinci mertebe (kaçınılmaz kırılma)

| Mertebe | Nesne | Soru |
|--------|--------|------|
| **1** | `Δ(S₀, S₁)` (tri-layer semantic delta) | Bu **gerçeklik adımı** izinli mi? |
| **2** | `Μ(Θ₀, Θ₁)` — meta-geçiş | **Yargı çerçevesi** (politika, `𝒯`, ledger başı, ETK sınıflandırması) bu şekilde **evrilebilir** mi? |

Burada **Θ** (theta): *epistemic phase point* — örneğin sabitlenmiş `EpistemicAdmissibilityPolicy`, o anda geçerli `TRANSITION_SPACE` yorumu, son ledger mührü ve/veya `verifyEpistemicTransition` sonucunun özeti. TTA-1 tek başına Θ’yi TLOA ile özdeşleştirmez; TTA-1.1, Θ’yi **ayrı mühürlenebilir** bir üst katman olarak tanımlar.

**Net ayrım:** Runtime “hangi Δ izinli?” der; **ikinci mertebe** “hangi **ETK(Δ)** / politika / 𝒯 yorumu bir sonraki adımda geçerlidir?” der. Bu, anayasa değişimi, PAG amendment, EBE’nin kural uzayını değiştirmesi ve CUT_OVER’un **kural düzleminde** tekrar oynanması ile aynı aileye girer — fakat TTA-1.1 bunu **tek cebir** altında birleştirir.

---

## 1. İkinci mertebe delta: `MetaΔ`

**Tanım (taslak):** `MetaΔ = metaEpistemicDiff(Θ₀, Θ₁)` — Θ’nin bileşenleri arasında yapılandırılmış fark:

- **Policy delta:** `pagAuthoritySatisfied`, `ecdmMaxLegitimacyDrift`, `requireDigestContinuity`, …  
- **𝒯 delta:** hangi `transitionSpaceKind` yollarının genişletildiği / kapatıldığı (kapalı küme üzerinde **yapısal** değişim).  
- **Ledger / digest continuity delta:** zincir başı, son `toDigest`, seq tutarlılığı.  
- **ETK sürüm / semantik:** `ETK_VERSION` / `TTA_VERSION` uyumu (replay katmanı).

Birinci mertebede `epistemicDiff` **state transition function** değildir; ikinci mertebede `metaEpistemicDiff` de **basit bir state makinesi** değildir — **kural uzayında** semantic operatördür.

---

## 2. Closure system (cebir kapanışı)

**TTA-1.1 hedefi:** İzinli dönüşümlerin kümesi yalnız `𝒯` ile değil, **`𝒯` üzerindeki izinli meta-dönüşümler** ile **kapalı** (veya kasıtlı olarak `AMBIGUOUS` / fail-closed) tutulur.

| Bileşen | Anlam |
|--------|--------|
| **Bileşim (1. mertebe)** | `Δ₂ ∘ Δ₁` — aynı Θ altında ardışık adımlar; sonuç ya yeni bir `Δ₃` ile özdeş (kapalı) ya da reddedilir. |
| **Meta-bileşim (2. mertebe)** | `Μ₂ ∘ Μ₁` — önce kural uzayı güncellenir, sonra (veya eşzamanlı) Δ değerlendirilir; **sıra** ve **etkileşim** normatif tabloda sabitlenir. **İki kural değişiminin birbirini bozup bozmadığı** ayrıca [HOGA-1](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) ile cebirsel olarak bağlanır. |
| **Refleksiyon** | Belirli `Μ` türleri yalnız **CUT_OVER** veya **PAG-sealed amendment** ile; TTA-I0 benzeri koruma meta-düzeyde tekrarlanır. |

**EPSC (Epistemic Phase Space Completion):** Faz uzayı, yalnız TLOA snapshot’ları değil; **(S, Θ)** çiftleri veya eşdeğer mühürlü ürün uzayıdır. “Completion”, bu uzayda **tüm izinli yörüngelerin** ya tanımlı bir `𝒯 × 𝒯_meta` altında kalması ya da açıkça **yasak** ilan edilmesidir.

---

## 3. TTA-1.1-I* (meta-güvenlik — taslak)

**TTA-1.1-I0:** `Θ`’deki **PAG / anayasa donması** altında, `MetaΔ` **otomatik** olarak `𝒯`’yi gevşetemez; gevşeme yalnız **üst-seviye witness** (CUT_OVER, mühürlü amendment) ile.

**TTA-1.1-I1:** `ETK(Δ)` çıktısı (`classification`, `errors`) **ledger’a yazılmışsa**, sonraki `MetaΔ` bu kaydı **sessizce silerek** veya **seq kırarak** meşrulaştırılamaz (`TTA_ERR_DIGEST_DISCONTINUITY` ailesinin meta-analogu).

**TTA-1.1-I2:** İkinci mertebe geçişi, birinci mertebede **şu an değerlendirilmekte olan** Δ’yi **geriye dönük** olarak meşru kılamaz (anti-teleoloji / anti-retroactive legitimacy).

**TTA-1.1-I3:** `Μ` ve `Δ` birlikte değerlendirilecekse, birleşik sonuç **deterministik** ve **replay** ile yeniden üretilebilir olmalıdır (TLOA digest / ledger satırları ile hizalı).

---

## 4. İlişkili kavramlar

- **[piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md):** Epoch ve CUT_OVER, **meta-geçiş**in örnek somut taşıyıcılarıdır.  
- **[PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md):** Otorite projeksiyonu değişimi, `MetaΔ`’nın **governance** yüzeyidir.  
- **[EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md):** `β_cap` evrimi, Θ içinde **ekonomik** bileşenin meta-yörüngesidir.

---

## 5. ETK-2 — Θ-dynamics coupling, meta-governance kernel, anayasal faz geçişleri

TTA-1.1’in **doğal tamamlayıcı sorusu** şudur ve tek başına TACS bunu cevapsız bırakır:

> **Kural uzayı nasıl ve ne zaman değişebilir?**

**ETK-2**, bu soruyu **Θ-dynamics** ile **TLOA / ETK-1** çıktılarına **eşler** (*coupling*): Θ serbestçe “zıplamaz”; yalnız **izinli meta-geçişler** ve **tanımlı tetikleyiciler** ile evrilir.

### 5.1 İki üst isim (aynı çekirdeğin yüzleri)

| İsim | Vurgu |
|------|--------|
| **Meta-governance kernel** | Θ’yi güncelleyen **normatif değerlendirici** — PAG / amendment / CUT_OVER ile hizalı ikinci katman; “kim, hangi witness ile, hangi `MetaΔ`’yı açabilir?” |
| **Epistemic constitutional phase transitions** | Θ’nin **faz**ları arasındaki izinli kenarlar — anayasa-benzeri “durumlar” arası geçiş; her fazda farklı `𝒯_meta` / farklı admissibility yüzeyi |

### 5.2 Θ-dynamics: *ne zaman* değişebilir?

Aşağıdakiler **en az biri** olmadan `Θ₀ → Θ₁` **otomatik** sayılmaz (fail-closed hedefi):

1. **Zaman / epoch olayı** — [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) CUT_OVER veya planlı epoch sınırı.  
2. **PAG-sealed amendment** — [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) kapsamında mühürlü otorite güncellemesi.  
3. **Ledger-temelli süreklilik** — önceki Θ, mevcut ledger `seq` / `toDigest` ile **uyumlu** olmalı; “geçmişi yok eden” Θ sıçraması yasak (TTA-1.1-I1 ile uyumlu).  
4. **ECDM / TLS sınıfı** — belirli `legitimacyClass` veya `stableBandHint` kombinasyonları yalnız **daraltılmış** `𝒯_meta` kenarlarına izin verir (ör. `CONSTITUTIONAL_DRIFT` altında 𝒯 gevşetimi **yok**).

### 5.3 Θ-dynamics: *nasıl* değişir?

- **MetaΔ** her zaman **yapılandırılmış** ve **mühürlenebilir** olmalı (TTA-1.1-I3).  
- **Eşleme (coupling):** `Θ₁ = Θ₀ ⊕ MetaΔ` yalnız şu koşulla kabul: `couple(Θ₀, S, MetaΔ) → ADMISSIBLE` — burada `S` güncel veya referans **TLOA snapshot**’ı; birinci mertebe gerçeklik, ikinci mertebe kuralın **tutarlı** güncellenmesini zorunlu kılar.  
- **Sıra semantiği:** Aynı “tick” içinde `Μ` sonra `Δ` mı, yoksa tersi mi — **kapalı tablo** ile sabitlenir; belirsizlik `AMBIGUOUS` / ret.

### 5.4 Epistemic constitutional phase transitions (ECPT)

**Tanım (taslak):** Θ’nin **faz etiketi** `φ(Θ) ∈ Φ` — `Φ` kapalı küme. Örnek aile (isimler normatif değil, şekil için):

| Faz (örnek) | Kısa anlam |
|-------------|------------|
| `REGULATED_EVOLUTION` | EBE/EBL yoluyla sınırlı kural hareketi; geniş CUT_OVER yok |
| `AMENDMENT_WINDOW` | PAG / council tanımlı pencerede `𝒯` veya politika güncellenebilir |
| `CONSTITUTIONAL_LOCK` | `MetaΔ` yalnız bakım / daraltma; gevşeme witness’sız yasak |
| `POST_CUT_OVER_STABILIZATION` | Epoch sonrası kısa süreli stabilizasyon; belirli Δ sınıfları askıda |

**Geçiş grafiği:** `𝒢_phase = (Φ, ℰ)` — yalnız `ℰ` içindeki `(φᵢ → φⱼ)` **meşru anayasal faz geçişidir**. Kenarlar **PAG + piEMS** ile mühürlenir; ECDM “kırmızı” sinyalde bazı `ℰ` kenarları **dinamik olarak devre dışı** kalır (Θ-dynamics ↔ ECDM coupling).

### 5.5 ETK-2 çekirdek yüzeyi (uygulama taslakları)

| Artefakt | Rol |
|----------|-----|
| `ThetaSnapshot` / `Θ` mührü | Politika + faz + ledger başı + ETK sürümü + opsiyonel TLOA `digest` referansı |
| `metaEpistemicDiff(Θ₀, Θ₁)` | İkinci mertebe delta (§1 ile aynı aile) |
| `coupleThetaDynamics(Θ₀, S, MetaΔ, metaPolicy)` | **Meta-governance kernel** — “bu kural hareketi şu gerçeklik kesitiyle bağlanıyor mu?” |
| `evaluateConstitutionalPhase(Θ, MetaΔ)` | `φ(Θ₀) → φ(Θ₁)` kenarının `𝒢_phase` içinde olup olmadığı |

**Hata ailesi (taslak):** `ETK2_ERR_THETA_UNCOUPLED`, `ETK2_ERR_PHASE_EDGE_ILLEGAL`, `ETK2_ERR_META_RETROACTIVE`, `ETK2_ERR_RULE_SPACE_JUMP` — ETK-1 `TTA_ERR_*` ile birlikte raporlanabilir.

---

## 6. Repo yönü (özet)

1. **Θ snapshot** — §5.5 şeması; TLOA ile çapraz mühür.  
2. **`metaEpistemicDiff` + `coupleThetaDynamics`** — ETK-2 modülü (ETK-1’den ayrı veya `ETK_2_0` sürümü).  
3. **`𝒢_phase` tablosu** — yapılandırılmış veri + test.  
4. **MK-1 / adversarial:** Θ sıçraması, faz dışı kenar, coupling ihlali hücreleri.  
5. **HOGA-1:** ardışık `MetaΔ` / ECPT yolu **bileşim doğrulaması** — [HOGA-1](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md).

---

## 7. Kaçınılmaz sonraki kırılma (işaret)

Tekil `MetaΔ` ve faz kenarı yeterli değildir: **MetaΔ ∘ MetaΔ** tutarlılığı ve **ECPT’nin bileşim altında kapalılığı** [HOGA-1](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md) ile ele alınır (*higher-order governance algebra* / *laws about law evolution consistency*).

---

**Mühür (TTA-1.1 / EPSC):**

> **Laws may move only along laws — or the phase space rips.**

---

*ECER-ADV TTA-1.1 — Transition Algebra Closure System; second-order transitions; epistemic phase space completion.*
