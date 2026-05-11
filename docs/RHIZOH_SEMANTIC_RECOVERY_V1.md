# Rhizoh — Semantic Recovery (SR-1) (V1)

**ECR dilinde:** **meaning** katmanı (anlık anlam / önceki ad: cognition alignment).

**Rol:** [WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md) sonrası **kaçınılmaz** katman — teknik kurtarma (replay, snapshot) **yapıldıktan sonra** kullanıcının **anlam dünyasında** ne olduğunu yönetir: yanlış veya eski world render edildiyse **ne görülür**, **state correction UI** nasıl davranır, **replay correction UX** güveni nasıl onarır. Bu belge **görsel tasarım dosyası değil**; **davranış ve kopya sözleşmesi**dir.

**Önkoşul:** RDCL + WC-PF üretimde; drift / rebuild pipeline çalışır durumda.

**Normatif üst belgeler:** [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md) · [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md) · [Companion-first UX](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Soru (tek cümle)

**“Sistem düzelttikten sonra kullanıcı hâlâ ‘yanlış gerçeklik’ mi sanıyor — yoksa düzeltmeyi anlayıp güveni yeniden mi kuruyor?”**

WC-PF **motoru** düzeltir; SR-1 **anlamı** düzeltir.

---

## 2. “Yanlış world” tanımı (tetikleyiciler)

| Kaynak | Örnek | Kullanıcı etkisi |
|--------|--------|------------------|
| **Drift** | `hash_replay ≠ hash_live` | Ekran ile log gerçeği çelişir |
| **Partial replay** | Gap kapatılmadan UI çizildi | Eksik katman / eski faz |
| **Broadcast lag / witness geç** | Embed “canlı” sanıldı | Boş veya kesik yayın |
| **Hata düzeltmesi** | Bug fix sonrası yeniden projection | Ani sıçrama |

**Ayrım:** Teknik olay (rebuild tamam) ≠ **semantic** olay (kullanıcı ne anladı).

---

## 3. İlkeler (yasaklar ve zorunluluklar)

| İlke | Açıklama |
|------|-----------|
| **Sessiz retroaktif yalan yok** | Düzeltme sonrası UI, önceki yanlış içeriği **sanki hiç olmamış** gibi göstermez (tarih silme) |
| **OWIS fazı yalanlanmaz** | Reducer çıktısı neyse gösterilir; “düzeltiyoruz” metni **faz numarasını çarpıtmaz** |
| **Tek state kaynağı** | SR-1, RDCL’deki tek reducer kuralını **bozmaz** — yalnız üstüne **durum + açıklama** katmanı ekler |
| **İleriye düzeltme önceliği** | Mümkünse yeni doğru state + açık `recovery` meta; zorunlu değilse geriye dönük diff (ürün kararı) |

---

## 4. Kullanıcı ne görür? (görünürlük seviyeleri)

| Seviye | Ne zaman | Davranış |
|--------|----------|----------|
| **L0 — Gizli** | Sadece alt piksel farkı | Genelde yalnızca log; **drift tespitinde L0 yasak** (en az L1) |
| **L1 — Durum şeridi** | Rebuild, gap kapanması, witness pending | Kalıcı veya dismissible banner: “Oturum yeniden senkronize ediliyor” |
| **L2 — World modu** | WC-PF `worldMode` | `stale` / `rebuilding` / `error` — Observe yüzeyinde **bloklayıcı olmayan** ama görünür |
| **L3 — Açık düzeltme** | Hash uyuşmazlığı giderildi, state sıçradı | “Görünüm güncellendi; neden: …” (kısa, teknik jargon opsiyonel) |

**Kural:** Drift **çözüldü**ğünde kullanıcıya en az **L3 kısa onayı** veya companion eşdeğeri (aşağı §7).

---

## 5. State correction UI (bileşen sözleşmesi)

### 5.1 Zorunlu meta (state’e ek veya paralel belge)

`recovery` (veya eşdeğer) alt nesne — örnek alanlar (isimler ürünle hizalanır):

| Alan | Amaç |
|------|------|
| `phase` | `idle` \| `detecting` \| `rebuilding` \| `corrected` \| `failed` |
| `reasonCode` | Makine okur (`DRIFT`, `SNAPSHOT_CORRUPT`, `GAP_CLOSED`, …) |
| `userMessageKey` | i18n anahtarı — serbest metin yok |
| `sinceMs` / `clearedAtMs` | Banner süresi ve temizleme |

### 5.2 UI yerleşimi (Observe)

- **Üst şerit:** `rebuilding` / `stale` sırasında; `corrected` sonrası **en az 3–8 sn** özet veya “anladım” ile kapanır.
- **Embed alanı:** witness `pending` iken placeholder; “canlı” etiketi yalnız witness `live` iken.

### 5.3 Erişilebilirlik

- Banner `role="status"` veya `alert` (kritik `error` modunda); odak tuzağı yaratmaz.

---

## 6. Replay correction UX (davranış)

| Aşama | UX |
|--------|-----|
| **Tespit** | İsteğe bağlı hafif gösterge (L1); arka planda drift job |
| **Rebuild** | `rebuilding`: etkileşim kısıtı **ürün kararı** (genelde okuma devam, yazım kısıtlı) |
| **Tamamlandı** | State tek adımda güncellenir; **animasyon** varsa “morph” değil **net kesme** + kısa açıklama (yanıltıcı süreklilik yok) |
| **Başarısız** | `error` + tek net eylem: “Yeniden dene” / sayfa yenileme / destek |

**Yasak:** Uzun süre yanlış world gösterip sonra sessizce doğruya geçmek (L0 düzeltme).

**Öneri:** İki frame arasında **bilinçli flash** veya “güncellendi” bandı — kullanıcı değişikliği **fark eder** (güven onarımı).

---

## 7. Companion / ürün dili (isteğe bağlı ama güçlü)

[Companion-first](RHIZOH_COMPANION_FIRST_UX_STATE_MACHINE_V1.md) ürününde: L3 mesaj companion kanalından **tek cümle** ile tekrarlanabilir (“Görünümünü olay kaydıyla eşitledik.”).  
Bu **zorunlu** değildir; Observe-only kullanıcı için şerit yeter.

---

## 8. Olay günlüğü (opsiyonel norma)

İleriye dönük şeffaflık için ayrı koleksiyon veya metadata:

- `semantic_recovery_log`: `{ correlationId, reasonCode, fromHash?, toHash?, at }`  
- Kullanıcıya varsayılan olarak **gösterilmez**; destek ve audit içindir.

**Alternatif:** Aynı bilgi `chronicle` stream’ine tek **seal** event (ürün kararı).

---

## 9. WC-PF ile hizalama

| WC-PF `worldMode` | SR-1 ekleri |
|-------------------|-------------|
| `stale` / `rebuilding` | `recovery.phase` eşlemesi + L1/L2 |
| `error` | L2 blok + tek recovery CTA |
| `live` + yeni `corrected` | L3 kısa onay |

---

## 10. Yol haritası (özet)

1. RDCL — deterministik `F`, `G`  
2. WC-PF — arıza altı tutarlılık  
3. **SR-1 — anlam ve güvenin onarımı** (bu belge)  
4. **TMC-1 — trust memory** — “düzeltildi” ile Chronicle / kullanıcı hafızası **[Trust Memory Consistency](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)**  
5. **ECR** çatı özeti: **[Epistemic Continuity Runtime](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)**  
6. **AIL-1** (müdahale / co-evolution milatı): **[Agency & Intent Shaping](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)**

---

## 11. İlişkili belgeler

- [World consistency under partial failure (WC-PF)](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)  
- [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)  
- [FER-1 Production Closure Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md)  
- **[Trust Memory Consistency TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)** (SR-1 sonrası)  
- **[Epistemic Continuity Runtime (ECR)](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)**  
- **[ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md)**  
- **[AIL-1](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)**

---

*Semantic Recovery V1 — correct events sonrası **correct experience**.*
