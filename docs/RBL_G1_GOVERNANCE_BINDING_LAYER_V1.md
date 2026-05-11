# RBL-G1 — Governance Binding Layer v1

**Rol:** [RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) **eylem politikası** üretir; **kimin** hangi eylemi **meşru şekilde** uygulayacağı, **veto / durdurma** sınırları ve **epoch / otorite ayrımı** altında politikanın nasıl **bağlandığı** bu belgede sabittir. Aksi halde R1 “havada” kalır — **governance binding** olmadan çözüm **sahiplik**e kayar (PAG aksiyomuna aykırı).

**Sürüm:** RBL-G1  
**Durum:** `NORMATIVE_TARGET` — policy + rol sınırı; runtime `governanceBind` / bundle alanları **sonraki faz**.  
**Önkoşul:** [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [RBL-R1](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) · [RBL-D1](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) · [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)  
**İlişkili:** [RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) (GCS sürümü / drift / epoch–authority senkron) · [CGR-1](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) · [`authorityBundle.mjs`](../scripts/authorityBundle.mjs) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) · [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md)

---

## 0. Dört açık soru (G1 cevabı)

| Soru | G1 özeti |
|------|-----------|
| **R1 seçimini kim override eder?** | **Tekil “override owner” yok.** Seçim **ProjectionAuthorityBundle** + [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) yaşam döngüsü ile bağlıdır: **Council** CUT_OVER / quorum önerisi; **Steward** yalnız önerir; **sessiz override** yasak (PAG-I1, PAG-I5). |
| **V-CLASS kararını kim veto eder?** | **Guardian execution veto etmez** — τ veya MK-1 çıktısını “geçersiz” ilan etmez. Guardian **governance evolution pause**: yeni R1 uygulaması / yeni bundle **yürürlüğe girmeyi** durdurabilir; **yayımlanmış constitutional witness** zorunlu (PAG-I6). **V-CLASS sınıflandırması** (D1) matematiksel/taahhüt düzeyindeyse “veto” yerine **üst politika değişimi** yeni bundle ile gelir. |
| **Resolution policy epoch değişince ne olur?** | Politika **epoch-scoped** kabul edilir: yeni `epochId` / CUT_OVER sonrası **yeni bundle** (veya açık `resolutionPolicyRef`) geçerli; **geriye dönük epoch rewrite yok** (PAG-I4). **Dual-read** penceresinde [piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) + [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) tanığı — iki politika **üst üste binmeden** hangi çağrının hangi politikayla değerlendirildiği açık olmalı. |
| **Authority split nasıl resolve edilir?** | **Çift yetki** aynı `piHash` / epoch için **örtüşen** iki meşru bundle iddiası: [Compat-1](PI_EMS_COMPAT_MATRIX_V1.md) + PAG **quorum / DISSENT_CAPTURE**; **R1 seçimi** yalnız **tek bağlayıcı bundle** ile πEFC’ye girer (`PAG_ERR_*` / scope mismatch). Çözüm = **yeni birleşik bundle** veya **açık fork** (tarihsel π replay) — sessiz birleştirme yok. |

---

## 1. R1 seçimi ↔ PAG rolleri

| Eylem | Kim bağlar |
|--------|------------|
| **R1-I-SELECT** (üretimde hangi τ) | **Bundle** içinde veya bağlı `resolutionPolicyRef` ile yayımlanan politika; uygulayıcı runtime **Steward değil**, **yayımlanmış yetki** (Council quorum + lifecycle). |
| **Steward** | Önerir; **unilateral SELECT yok**. |
| **Council** | Quorum recommendation, dual-read tasarımı, CUT_OVER önerisi — R1 politikasının **yürürlüğe girmesi** ile hizalanır. |
| **“Override”** | Anayasal anlamda = **yeni yayımlanmış otorite** (bundle / epoch), **tekil aktörün üstüne atlama** değil. |

---

## 2. Veto ve durdurma sözlüğü

| Terim | G1 anlamı |
|-------|-----------|
| **Veto (yok)** | τ veya D1 sınıfı üzerinde **tekil veto** yoktur; **dissent** append-only kalır ([PAG-I3](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md)). |
| **Guardian freeze** | **Governance plane** pause — yeni resolution policy enactment, yeni migration, yeni bundle uygulama **durur**; **execution plane** (kernel, geçmiş τ replay) sürer ([PAG-1 §1.3](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md)). |
| **πEFC ret** | Yapısal / policy **uyumsuzluk** — “veto” değil, **sınır**. |

---

## 3. Resolution policy ve epoch

```text
resolutionPolicy effective ⟷ (epochId, authorityBundle, optional dualReadWitness)
```

- **Epoch sıçraması:** CUT_OVER sonrası **yeni** `epochId` → geçerli R1 metni bundle veya sabitlenmiş artefakttan; eski epoch politikası **archive** (R1-III) hizasında kalır.
- **Dual-read:** Aynı anda iki epoch politikası “tek sonuç” üretmez — çağrı **hangi epoch bağlamında** olduğunu taşır (`epochContext`, [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)).
- **Sessiz policy değişimi** yasak (PAG-I1, RTBL-I4 ile uyum).

---

## 4. Authority split (çift yetki)

**Belirti:** İki farklı `ProjectionAuthorityBundle` aynı operasyonel pencerede **çakışan** `piHash` / `epochId` iddiası.

**Çözüm yolu (normatif sıra):**

1. **Compat matrisi** — πᵢ↔πⱼ ilişkisi açık mı? ([Compat-1](PI_EMS_COMPAT_MATRIX_V1.md))  
2. **PAG lifecycle** — hangi öneri QUORUM / CUT_OVER aşamasında?  
3. **Tek πEFC girişi** — `evaluateBindIndexed` **tek** `authorityBundle` + tutarlı `epochContext`; çakışan ikinci bundle **aynı çağrıda** birleştirilmez.  
4. **DISSENT_CAPTURE** — çakışan öneri tarihçesi silinmez.  
5. **RBL-R1 V-CLASS-III** — uzlaşma + archive ile **yeni tek hat** mühürlenene kadar üretim **belirsiz** kalabilir (`UNDEFINED` / fail-closed).

---

## 5. Bundle genişlemesi (hedef alanlar)

`ProjectionAuthorityBundle` veya bağlı artefakta (RBL-G1.1) önerilen opsiyonel alanlar:

- `resolutionPolicyRef` — R1 politika sürümü / hash.  
- `resolutionEpochScope` — hangi `epochId` aralığında geçerli.  
- `guardianSeal` — freeze / unfreeze constitutional witness (mevcut PAG alanı ile uyum).

---

## 6. Governance binding invariants (RBL-G-I*)

| Kimlik | İfade |
|--------|--------|
| **RBL-G-I1** | **No unbound resolution** — R1 SELECT üretimde yayımlanmış yetki olmadan uygulanamaz. |
| **RBL-G-I2** | **No silent override** — seçim değişimi yeni bundle veya açık politika revizyonu ile gelir. |
| **RBL-G-I3** | **Guardian halts governance, not judgment history** — freeze, geçmiş τ’yi “yok saymaz”. |
| **RBL-G-I4** | **Epoch binds policy scope** — policy epoch dışında **implicit** genişlemez. |
| **RBL-G-I5** | **Authority split resolves by published reconciliation** — çift bundle çözülmeden tekilleştirme yok. |

---

## 7. Boru hattındaki yer

```text
… → RBL-D1 (classify) → RBL-R1 (policy action) → RBL-G1 (who may bind / epoch / split) → RBL-A1 (constraint lineage / drift / boundary sync) → PAG bundle → πEFC / MK-1
```

---

## 8. Sonraki repo adımları

- Bundle şemasına `resolutionPolicyRef` (opsiyonel) + doğrulama.  
- `PAG_ERR` genişlemesi veya `RBL_G_ERR_*` — unbound resolution, split unresolved.  
- Dokümantasyon: [PAG-1 §4](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) ile çapraz tablo; [RBL-A1](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) ile GCS / joint CUT_OVER.

---

**Mühür (RBL-G1):**

> **Policy without governance is possession in disguise.**

---

*RBL-G1 — Governance Binding Layer; who binds R1, what veto means, epoch-scoped policy, authority split.*
