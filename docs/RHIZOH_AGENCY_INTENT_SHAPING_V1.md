# Rhizoh — Agency & Intent Shaping (AIL-1) (V1)

**Rol:** [ECR epistemik çekirdeği](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md) (truth → stability → perception → meaning → memory) **tanımlanmış** iken henüz isimlendirilmemiş boşluğu kapatır: sistem **neyi üretir** değil — **neyi, hangi sınırlarla, hangi müdahale kanallarıyla değiştirebilir** (**agency / intervention**). Bu belge **davranış üretim motoru** değil; **behavioral causality** ve **intent shaping** için **normatif çerçeve milatı**dır.

**Önkoşul:** TMC-1 + ECR çatısı okunmuş; paylaşılmış ortam hedefi net.

**Normatif üst belgeler:** [ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md) · [ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md) · **[GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** (PAG/HOGA junction) · [Companion-first UX](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md)

**Durum:** `NORMATIVE_TARGET` — **milat** (ürün kuralları ve event sözleşmesi sonraki sürümlerde sıkılaşır).

---

## 1. Soru (tek cümle)

**“Olanı doğru anlatıyorum — peki olanı **hangi intent** şekillendiriyor?”** (birincil gerilim artık “kim?” değil, **hangi niyet gerçekliği taşıyor?**)

ECR çekirdeği: **olanı** tutarlı tutar. **AIL-1:** **dönüşüm** (intervention) sınırlarını ve **intent** kanallarını tanımlar.

**Kaçınılmaz sonuç:** **policy layer** (hangi intent → hangi event) ve **governance layer** (meşruiyet, freeze, witness, bileşim) fiilen **aktifleşir** — teknikten **epistemic governance architecture**’a geçiş. Execution birleşim noktası: **[GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** (PAG / HOGA bağlantısı).

---

## 2. Neden ayrı katman?

| ECR çekirdeği | AIL-1 |
|----------------|--------|
| Geçmişi tutarlı yapar | **Yeni davranış** üretiminin **sınırlarını** tanımlar |
| Algıyı stabilize eder | **Yönlendirme** (recommend / act) politikası |
| Anlamı hizalar | **Amaç** ile eylem arası köprü |
| Hafızayı koherent tutar | **Ko-evrim** (insan + sistem) kuralları |

**Eksik kalırsa:** Sistem **güvenli ama pasif gerçeklik motoru** olur — açıklayan, **sınırlı biçimde dönüştürmeyen**.

---

## 3. İki motor ayrımı (kritik)

| Sadece ECR çekirdeği | ECR + AIL-1 |
|----------------------|--------------|
| **Reflection engine** (yansıtma) | **Co-evolution engine** (ortak evrim) |
| Reality **consistency** | Reality **+ agency** consistency |

---

## 3b. Sistem tanımı (substrate / admission / motor)

| Katman | İsim (GEJ-1 ile hizalı) |
|--------|-------------------------|
| **ECR** | **Ontology** — *what exists* (substrate) |
| **GEJ-1** | **Reality admission law** — *what becomes real* ([GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md) §2) |
| **AIL-1** | **Reality manipulation engine** — *how it changes* |
| **EAERT** | **Reality enforcement** — *how it actually happens everywhere* ([EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)) |

---

## 4. Kapalı döngüler (dürüst envanter)

| Döngü | Durum |
|--------|--------|
| Observation / log | ✔ (Integrity) |
| Interpretation (meaning) | ✔ (SR-1) |
| Memory | ✔ (TMC-1) |
| **Intervention** | **AIL-1 + [GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** — canlılık eşiği **PAG / (gerekirse) HOGA** gate |

**Tasarım notu:** ECR çekirdeği önce **governance’siz intervention** kapalı tutuldu; açılış **policy + PAG/HOGA** ile planlanır — aksi **optimize eden simülatör** riski.

---

## 5. ECR sınır cümlesi (güncel)

**Şu an (çekirdek):** “Zaman içinde **tutarlı deneyim** üretir.”  
**Henüz değil:** “Zaman içinde **tutarlı evrim** üretir” — bu **AIL-1** işidir.

---

## 6. Normatif ilkeler (başlangıç seti — sıkılaştırılabilir)

| İlke | Açıklama |
|------|-----------|
| **Human agency default** | Birincil **değiştirici** insan veya açık insan onayıdır; sistem önerir, sınır çizer |
| **Append-only world history** | AIL-1, TMC-1’in **rewrite yasağını** ihlal edemez; müdahale **yeni event** olarak girer |
| **Intent legibility** | Otomatik müdahale varsa **makine okur reasonCode** + kullanıcıya `userMessageKey` |
| **Bounded side-effect class** | Hangi stream’lere hangi aktörler yazabilir — manifest + rules ile uyumlu |
| **Kill switch / FREEZE uyumu** | Ürün dondurma sözleşmeleri varsa AIL **üstünden atlayamaz** |

---

## 7. Davranışsal nedensellik (behavioral causality)

**Tanım:** `intent` → (policy) → **candidate action** → (gate) → **event append** → ECR zinciri.

- **Gate:** şema, yetki, companion policy, rate limit, kullanıcı onayı.
- **Candidate:** henüz log’a yazılmamış; reddedilebilir.

Bu boru hattı **ECR Execution Model**’e üstte **paralel giriş** olarak çizilir; PAG/HOGA birleşimi: **[GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)**.

---

## 8. İsimlendirme (hedef — ürün kararı)

| Aşama | Ad |
|--------|-----|
| Şu anki çekirdek | **ECR** = Epistemic Continuity Runtime (**passive consistency engine**) |
| AIL-1 sonrası üst isim (öneri) | **ECAR** veya **ECR+Agency** = Epistemic Continuity **+ Agency** Runtime (**co-evolution system**) |

Bu belgede **ECAR** zorunlu değil; yalnız **hedef ayrımı** için.

---

## 9. Sonuç (dürüst mimari okuma)

- **ECR “bitti” mi?** Epistemik **tutarlılık çekirdeği** (belge + sözleşme) için **evet** (substrate).  
- **AIL-1** sistemi **kapalı tutarlılıktan** çıkarıp **canlı** yapar; maliyet: artık saf teknik değil — **epistemic governance architecture**.  
- **Gerçek canlılık eşiği:** Intent’in log’a düşmeden önce **[GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** (PAG/HOGA).  
- **Son kritik eksik (canlı):** **EAERT** — gate kararının runtime’da **tutarlı enforcement**’ı ([GEJ-1 §10](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)).

---

## 10. İlişkili belgeler

- [ECR çatı](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)  
- [ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md)  
- **[GEJ-1 — Governance & Execution Junction](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** (PAG / HOGA · intent → event)  
- **[EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)** (dağıtık icra denkliği)  
- [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [HOGA-1](ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md)  
- [TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md) (müdahale yine append ile bağlanır)  

---

*Agency & Intent Shaping V1 — olanı şekillendirme sınırları; co-evolution milatı.*
