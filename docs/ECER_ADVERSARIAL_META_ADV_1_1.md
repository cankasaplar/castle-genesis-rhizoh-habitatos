# ECER-ADVERSARIAL META — ADV v1.1 (Meta-Generator & Axis Completeness)

**Rol:** [ECER-ADV-1](ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md) **önceden tanımlı** senaryolarla sınırı kapatır; **ADV v1.1** ise “**unknown unknowns**” boşluğuna karşı **türetilmiş** adversary üretimini ve **eksen-temelli completeness** ölçütünü normatif olarak sabitler. Kapsama artık yalnızca sınıf listesi değil: her **RBL-D1** (`DIVERGENCE_CLASS`) için **üç eksende** en az bir perturbasyon varyantı zorunludur.

**Sürüm:** ECER-ADV-META-1.1  
**Durum:** `NORMATIVE_TARGET` — üreteç implementasyonu **sonraki faz**; ölçüt ve eksenler bu belgede kilitli.  
**Önkoşul:** [ECER-ADV-1](ECER_ADVERSARIAL_FIXTURE_SUITE_V1.md) · [RBL-D1](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) · [`classifyDivergence.mjs`](../scripts/classifyDivergence.mjs)  
**İlişkili:** [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [piEMS-1 §4](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [**LOOP-1**](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) (EGK / SCG / MCE · OSR · GPF)

---

## 0. Sistem sınırı (şu anki açık soru)

- **ECER-ADV-1:** kapalı bir **adversarial world** — her senaryo tanımlı ve assert edilebilir.  
- **Sorun:** senaryo **uzayı sonlu**; üretim ortamındaki hatalar ve saldırılar **listelenmemiş** varyantlarla gelebilir (**unknown unknowns**).  
- **ADV v1.1 cevabı:** senaryoları yalnız elle çoğaltmak yerine, **türetme kuralları** + **completeness ölçütü** ile uzayı **sistematik** genişletmek.

---

## 1. ADV v1.1’in teknik rolü: meta-adversarial generator

**Tanım (hedef):** *Meta-adversarial generator*, önceden yazılmış fixture listesinin **dışında** kalan, fakat:

- kapalı enum’lar (`DIVERGENCE_CLASS`, `RESOLUTION_ACTION`, `PAG_ERR`, `RBL_A_ERR`, `MK1_ERR`, …) içinde kalan  
- **deterministik** veya **kontrollü stokastik** (seed’li) perturbasyonlarla üretilen  

vaka havuzunu üretir.

**Türetme kanalları (örnek aileler — uygulama ADV-1.1+ repo adımı):**

| Kanal | Anlam | Örnek mekanizma |
|--------|--------|------------------|
| **D1 ∘ R1 ∘ A1** | Üç closure’ın **bileşik** girdisi: önce divergence sınıfı, sonra default R1 eylemi, sonra authority/GCS/epoch closure ile çelişki enjekte etme | Özellik vektörü → `classifyDivergence` → `resolveVClass` → `validateAuthorityRblClosure` / bundle mutasyon |
| **Witness perturbation** | Aynı payload altında `witnessSet` / mühür bağlamı / `observedAt` kaydırması (kontrollü gürültü) | Seed’li `witnessArtifact` varyantları; RBL-I4 / contextual determinism sınırı |
| **Epoch folding** | İki veya daha fazla epoch etiketinin **aynı τ** üzerinde çakıştırılması (dual-read, stagger, CUT_OVER hayaletleri) | `epochContext` + `projectionEpochId` + `mk1DualReadWitness` kombinasyonları |
| **Authority graph mutation** | Bundle alanlarının **yerel** grafiksel komşulukları: `piHash`, `epochId`, `resolutionPolicyRef`, `governanceConstraintSetId`, `bundleHash` tutarsızlıkları | PAG / RBL-A ret yollarının sistematik keşfi |

Bunlar **yeni divergence sınıfı icat etmez**; mevcut **D1 yüzeyinde** kalır, **gate** ve **kod** kapanışını zorlar.

---

## 2. Adversarial completeness criterion (normatif)

**Ölçüt (ADV-1.1 — zorunlu):** Her `DIVERGENCE_CLASS` değeri `𝒟` için, meta-generator çıktı havuzunda **en az** şu üç **eksenden** birer **geçerli** varyant bulunmalıdır:

1. **Witness axis (W):** RBL witness / `witnessSet` / mühür bağlamı perturbasyonu; beklenen gate çoğunlukla **RBL** veya τ yapısı.  
2. **Authority axis (A):** `ProjectionAuthorityBundle` / RBL-A1 closure / PAG yaşam döngüsü perturbasyonu; beklenen gate **PAG** veya **RBL_A_ERR_***.  
3. **Epoch axis (E):** `epochContext`, `projectionEpochId`, dual-read, compat matrisi perturbasyonu; beklenen gate **πEFC** / `MK1_ERR_*`.

**Geçerli varyant:** Üçlü kilit korunur: `classifyDivergence` girdisi (veya türev özellik vektörü) → `resolveVClass` çıktısı → **tek** runtime gate üzerinde **kapalı** `code` / `decisionClass` (UNDEFINED yok).

**Kapsama okuması:** Artık “kaç senaryo var?” değil; “her `𝒟` için **W × A × E** hücrelerinin en azı doldu mu?” sorusu.

**Kapalı D1 yüzeyi (referans):** `W_INDEPENDENT`, `W_EXCLUSIVE`, `W_VOID`, `PI_SPLIT_NON_BREAKING`, `PI_SPLIT_BREAKING`, `PI_SPLIT_INCOMPARABLE`, `EPOCH_FORK`, `DIVERGENCE_NONE`, `DIVERGENCE_UNKNOWN` — [`classifyDivergence.mjs`](../scripts/classifyDivergence.mjs).

---

## 3. Completeness matrisi (şablon)

Üretici her sürümde aşağıdaki matrisi **doldurulmuş** artefakt olarak yayınlamalıdır (JSON / CI raporu):

| `𝒟` \ Eksen | **W** (witness) | **A** (authority) | **E** (epoch) |
|-------------|-----------------|-------------------|---------------|
| `W_INDEPENDENT` | ☐ | ☐ | ☐ |
| `W_EXCLUSIVE` | ☐ | ☐ | ☐ |
| … | … | … | … |

*(Tam liste: tüm `DIVERGENCE_CLASS` satırları.)*

**ADV-1.1 kabulü:** Tüm hücreler ☑ ise completeness **axis-complete** (bu milestone için yeterli alt sınır). İsteğe bağlı üst sınır: hücre başına birden fazla varyant (regresyon derinliği).

---

## 4. ECER-ADV-1 ile ilişki

- **ADV-1:** sabit **beş** operasyonel sınıf — regresyon omurgası.  
- **ADV-1.1:** `𝒟 × {W,A,E}` **ölçütü** — uzayı kapatma iddiası.  
- İkisi birlikte: **sınıf tabanlı** smoke + **eksen tabanlı** completeness.

---

## 5. Boş hücre tespiti + sentetik öneri (ADV-1.1 uygulaması)

**CI / yerel:**

| Komut | Amaç |
|--------|------|
| `npm run epistemic:ecer-adv-check` | Doğrulanmış registry matrisi **eksensel tam** değilse **exit 1** + eksik hücre sayısı / ipucu. |
| `npm run epistemic:ecer-adv-suggest` | Eksik her `(𝒟, eksen)` için **deterministik** minimal mutasyon reçetesi (witness / authority / epoch). |
| `node scripts/ecerAdversarialMetaHarness.mjs suggest --write <file.json>` | Önerileri dosyaya yazar (inceleme / iş emri). |

**İş akışı:** `check` fail → `suggest` → senaryo uygula → [`coverageRegistry.mjs`](../scripts/fixtures/ecer-adversarial/coverageRegistry.mjs) içinde `VERIFIED_COVERAGE` satırı ekle → `check` tekrar.

**Opsiyonel overlay:** `check --overlay matrix.json` — `{ "matrix": { "<DIVERGENCE_CLASS>": { "<ADV_AXIS_*": true } } } }` ile geçici birleşik matris (ör. dış rapordan gelen tamamlanmış hücreler); kalıcı doğrulama registry’de olmalıdır.

**Modüller:**

- [`ecerAdversarialMetaHarness.mjs`](../scripts/ecerAdversarialMetaHarness.mjs) — `check` \| `suggest`.  
- [`ecerAdversarialSynthetic.mjs`](../scripts/ecerAdversarialSynthetic.mjs) — hücre başına `classifyPreserve` + eksen mutasyon adımları.  
- [`coverageRegistry.mjs`](../scripts/fixtures/ecer-adversarial/coverageRegistry.mjs) — `VERIFIED_COVERAGE` (şu an ECER-ADV-1 ile **5** hücre; tam kapanış **27** hücre).

**Sonraki repo adımları (derinleştirme):**

1. Seed’li perturbasyon operatörleri + otomatik assert iskelesi.  
2. `suggest` çıktısından tek tıkla `scenarios.mjs` kancası üretimi (ADV-1.2).

**Öz-üretim döngüsü (resmi spec):** [ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md](ECER_ADV_SELF_GENERATING_LOOP_SPEC_V1.md) — **EGK** (epistemik gap), **SCG** (sentetik kısıt + executable τ hedefi), **MCE** (manifold kapanış / rezidü / instabilite), **Epistemic Hunter Mode**, **Ontological Safety Rule**, **Gap Prioritization Function (GPF)**. **Kaynak tavanı (LOOP-1.1):** [ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md](ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md) (**EBL** / **ERGS** kontrol düzlemi · **CLEOS** yığını). **Bütçe evrimi:** [EBE-1](ECER_ADV_EPISTEMIC_BUDGET_EVOLUTION_EBE_1.md). **Üçlü denge (EBE-1.1):** [TLS-1.1](ECER_ADV_TRI_LAYER_STABILITY_EBE_1_1.md).

---

**Mühür (ADV v1.1):**

> **Finite scenarios bound the known; axes bound the unknown.**

---

*ECER-ADVERSARIAL META ADV v1.1 — meta-generator role, axis-based adversarial completeness over RBL-D1.*
