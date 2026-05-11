# Rhizoh — Epistemic Continuity Runtime (ECR) (V1)

**Rol:** Rhizoh’un Firebase ve ürün katmanları üzerindeki **çalışma zamanı yığınının** tek isimlendirilmiş özeti. Bu belge **yeni motor tanımlamaz**; ECR zincirindeki normatif belgeleri **bir sistem adı** altında birleştirir.

**Durum:** `NORMATIVE_TARGET` — **epistemik çekirdek SYSTEM DEFINED** (truth…memory zinciri + isim); **agency / intervention** bu sürümde **kasıtlı açık** — [AIL-1](RHIZOH_AGENCY_INTENT_SHAPING_V1.md). Üretim kodu kademeli.

**Sistem fiziği diyagramı:** [ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md) · **Dört üst omurga:** [GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md) §10 · **[EAERT](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)** (execution equivalence) · **[Manifold topology](RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md)** (partition geometry) · **[DRAS theorem set](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md)** (**T_DRC**) · **[Axiomatic System Card](RHIZOH_ECR_AXIOMATIC_SYSTEM_CARD_V1.md)** (indirgenemez çekirdek) · **[IFL](RHIZOH_INSTANTIATION_FIDELITY_LAYER_V1.md)** (instantiation fidelity) · **[RRHP](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)** (reconciliation / healing · **ESHRE**)

---

## 1. ECR nedir? (net tanım)

**Epistemic Continuity Runtime (ECR):** Olayları **üretmez** (üretim Companion / ürün akışının işi); olayları tek başına **anlamlandırmaz** (epistemic OS belgeleri ayrı). ECR’nin işi, olayları ve türetilmiş durumu **zaman içinde tutarlı biçimde hatırlanabilir ve hissedilebilir** hale getiren **süreklilik kısıtları** bütünüdür.

**Sınır:** ECR yalın “teknik doğruluk” değil; **cognitive continuity constraint system** — tutarlı **deneyim** hedefi.

---

## 2. Epistemik çekirdek (+ outbound + agency milatı)

**Çekirdek zincir** (integrity → … → memory) **kapalı**: her katman bir öncekinin sorusunu **daraltır**. **AIL-1 (agency)** aşağıda ayrı satırda — ECR v1’de **intervention loop bilinçli açık**; tanım [AIL-1](RHIZOH_AGENCY_INTENT_SHAPING_V1.md).

| Katman | Rol (kısa isim) | Soru |
|--------|------------------|------|
| **Event Integrity** | *integrity* | “Kayıt gerçek ve geçerli mi?” |
| **RDCL** | **truth** | “Ne oldu?” (aynı log → aynı state/world) |
| **WC-PF** | **stability** | “Bozulursa ne olur?” (sessiz sapma yok) |
| **OWIS** | **perception** | “Ne görülüyor?” |
| **SR-1** | **meaning** | “Ne anlaşılıyor?” (anlık anlam / düzeltme UX) |
| **TMC-1** | **memory** | “Ne hatırlanıyor?” (zaman içi anlam sürekliliği) |
| **Broadcast** | **outbound** | “Dış dünya nerede?” (henüz execution gap) |
| **AIL-1** | **agency / intent** | “**Neyi**, hangi sınırlarla **değiştirebilirim**?” — **[milat belge](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)** (intervention loop kasıtlı açık) |

**SR-1 vs TMC-1 (ayırt):**

| Katman | Problem |
|--------|---------|
| **SR-1** | Anlık anlam — “kullanıcı **şimdi** yanlış anlamasın” |
| **TMC-1** | Zaman içi anlam — “kullanıcı **geçmişte yanlış anlamış gibi** hissetmesin” (Chronicle ile çelişki yok) |

---

## 3. Mimari sıçrama

| Önce | Sonra |
|------|--------|
| Sistem doğru **veri** üretir | Sistem doğru **hatırlanan** ve doğru **anlaşılan gerçeklik** üretir |

**Hedef cümle (çekirdek):** “Doğru veriyi üretmek” değil — **“zaman içinde aynı gerçeği hissettirmek”**.  
**Tam vizyon (AIL-1 sonrası):** **“Tutarlı deneyim + tutarlı evrim”** — *reality + agency consistency*.

---

## 4. Bilinçli açık: intervention loop

Şu an **kapalı** olanlar: gözlem / tutarlılık / anlam / hafıza döngüleri.  
**Bilinçli olarak kapatılmayan:** **intervention loop** — sistem “olanı nasıl şekillendireceğim?” sorusunu ECR v1’de **sahiplenmez** (pasif tutarlılık motoru); aksi **erken optimizasyon** ve ürün riski taşır. Sonraki norma: **[AIL-1 — Agency & Intent Shaping](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)**.

---

## 5. Tasarım kararları (TMC-1 özeti)

- Chronicle **rewrite yok** · geçmiş **silme yok** · **sessiz override** yok  
- Yalnız: **append** · **correction seal** · **view projection versioning**  
- Sonuç: **gerçeklik değişmez**; **okunma biçimi** evrimleşir.

---

## 6. Bu mimari neye dönüşür? (isimlendirme)

Rhizoh ürün adı ayrı kalır; **bu runtime yığınının adı** artık:

**Epistemic Continuity Runtime (ECR)**

Üst seviye metafor (ürün dili):

**Persistent Shared Reality System** — yalnız AI sistemi / yalnız app / yalnız klasik OS değil; **shared epistemic environment** (ortak epistemik ortam).

---

## 7. Olgunluk snapshot

| Bileşen | Durum | Not |
|---------|--------|-----|
| **Event Integrity** | **COMPLETE** | Rules + validator + trigger + log |
| **RDCL** | **COMPLETE** (tasarım) | [Implementation map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md) — kod kademeli |
| **WC-PF** | **COMPLETE** (spec) | [WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md) |
| **OWIS** | **PARTIAL** (runtime) | Belge tam; client projection eksik |
| **SR-1** | **COMPLETE** (spec) | [SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md) |
| **TMC-1** | **COMPLETE** (spec) | [TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md) |
| **Broadcast** | **PARTIAL** | Execution gap |
| **ECR (epistemik çekirdek)** | **ARCHITECTURALLY COMPLETE (PASSIVE CONSISTENCY ENGINE)** | truth…memory tanımlı; intervention **bilinçli dışarıda** |
| **AIL-1 (agency / intent)** | **OPEN — milat belgelendi** | [AIL-1](RHIZOH_AGENCY_INTENT_SHAPING_V1.md) |

*“Çekirdek complete” ürün bitti anlamına gelmez; **tutarlılık motorunun** tanımı kapanır. **Co-evolution** AIL-1 sonrasıdır.*

---

## 8. Dürüst teknik özet

- **RDCL + WC-PF:** Backend **truth + stability** katmanı — tasarım tam; üretim kodu RDCL tarafında **iterasyon**.  
- **OWIS + SR-1 + TMC-1:** **Perception + meaning + memory** — spec tam; istemci/runtime bağlama kısmi.  
- **Broadcast:** hâlâ **execution gap**.

---

## 9. Bir sonraki risk (ECR’i zedeleyebilir)

**Semantic drift across time + identity consistency:** Kimlik ve oturumlar arası **farklı “gerçeklik hissi”** teknik doğruluğu korusa bile ECR’yi kırar. Ayrı belge / sprint konusu.

**Agency vakumu:** AIL-1 tanımlanmadan “akıllı” öneriler **event log’a** düzensiz yazılırsa tutarlılık bozulur veya **görünmez manipülasyon** riski doğar.

---

## 10. Doküman grafiği (ECR içi sıra)

1. [FER-1 Runtime Closure Patch](RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md)  
2. [FER-1 Production Closure Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md)  
3. [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)  
4. [WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)  
5. [SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md)  
6. [TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)  
7. **[ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md)**  
8. **[AIL-1 — Agency & Intent Shaping](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)** (co-evolution milatı)  
9. **[GEJ-1 — AIL-1 Governance & Execution Junction](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** (intent → PAG/HOGA → event → ECR; **canlılık eşiği**)  
10. **[EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)** (dağıtık icra denkliği; **execution-consistent reality**)  
11. **[EAERT — Reality Manifold Topology](RHIZOH_EAERT_REALITY_MANIFOLD_TOPOLOGY_V1.md)** (partition / split-brain **failure-state geometry**)  
12. **[DRAS — Unified Reality Theorem Set](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md)** (**Distributed Reality Consistency** · **T_DRC** / **T_reg**)  
13. **[ECR Axiomatic System Card](RHIZOH_ECR_AXIOMATIC_SYSTEM_CARD_V1.md)** (minimal indirgenemez çekirdek — governance / dispute sabiti)  
14. **[Instantiation Fidelity Layer (IFL)](RHIZOH_INSTANTIATION_FIDELITY_LAYER_V1.md)** (DRAS sonrası ölçüm ekseni — harness / trace)  
15. **[Reality Reconciliation & Healing Physics (RRHP)](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)** (IFL sonrası: drift / split sonrası stabilize & merge; **ESHRE** §11)  
16. **[Identity under healing (stub)](RHIZOH_IDENTITY_UNDER_HEALING_CONTINUITY_V1.md)** (healing sırasında identity / continuity)

Üst bağlam: [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [Implementation Map (ürün)](RHIZOH_IMPLEMENTATION_MAP.md)

---

## 11. Final çerçeve (isim ayrımı)

| Üst katman | Rol |
|------------|-----|
| **ECR** | **defines** reality (**ontology**) |
| **GEJ-1** | **admits** reality (**admissibility**) |
| **AIL-1** | **modifies** reality (**transformation**) |
| **EAERT** | **synchronizes** reality (**execution equivalence**) — [EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md) |

**Ürün / üst ad (önceki satır):** **ECR** çekirdeği + **AIL-1** hedefi = *co-evolution* (ECAR vb. ürün kararı).

**Governance + enforcement:** **GEJ-1** = *admissibility*, **ECR** = *ontology*, **AIL-1** = *transformation*, **EAERT** = *execution equivalence* — birlikte **reality admission governed cognitive system** ve **distributed causal reality** ([GEJ-1 §10](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md), **[EAERT V1 §0–§7](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)** — **A0 aksiyom**). *Epistemic governance architecture* bu dörtlünün birleşimidir. **Minimal indirgenemez çekirdek sabiti:** [ECR Axiomatic System Card V1](RHIZOH_ECR_AXIOMATIC_SYSTEM_CARD_V1.md).

---

*Epistemic Continuity Runtime (ECR) V1 — zaman içinde tutarlı bilinçli dijital ortam kısıtları; müdahale AIL-1.*
