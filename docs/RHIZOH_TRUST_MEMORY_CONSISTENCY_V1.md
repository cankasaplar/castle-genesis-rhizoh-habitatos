# Rhizoh — Trust Memory Consistency (TMC-1) (V1)

**Rol:** [SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md) sonrası **kaçınılmaz** soru — kullanıcı “düzeltildi”yi **gördü**; **hatırlaması** ve sistemdeki **Chronicle** (kalıcı hikâye) **aynı epistemik gerçeği** paylaşır mı? Bu belge **Chronicle rewrite yasağını** ve **restore** ile **hafıza normalizasyonu** UX’ini normatif bağlar.

**Önkoşul:** SR-1 üretimde; `recovery` / düzeltme akışları kullanıcıya görünür.

**Normatif üst belgeler:** [SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md) · [WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md) · [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) (`chronicle` stream) · [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)  

**Çatı:** [ECR — Epistemic Continuity Runtime](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Soru (tek cümle)

**“Kullanıcı düzeltildi dediğini hatırlıyor; Chronicle ve audit gerçeği ile **çelişmeden** bu hafıza nasıl normalize olur?”**

SR-1 **anlık bilişsel hizalama** (cognition alignment); TMC-1 **zamana yayılan güven hafızası** (trust memory consistency).

---

## 2. İlkeler

| İlke | Normatif |
|------|-----------|
| **Chronicle immutable** | Geçmiş `chronicle_entry_sealed_v1` (ve eşdeğer) kayıtları **rewrite / silme / sıralama değiştirme** ile “düzeltme” **yasak** |
| **Restore ≠ edit** | “Restore” yalnız **yeni append** veya **yeni seal** ile ifade edilir; eski entry **superseded** meta ile işaretlenir, içerik silinmez |
| **Tek audit gerçeği** | Kullanıcı hikâyesi ile event log **çelişirse** — log ve projection SoT; UI **hikâyeyi** log’a uydurur (tersi yasak) |
| **Hatırlama normalize** | Ürün, kullanıcıya “yanlış hatırlıyorsun” demez; **zaman çizelgesine yeni beat** ekler: “Şu anki doğrulama şudur” |

---

## 3. Chronicle: rewrite edilmez, restore edilir

### 3.1 Yasak

- Eski chronicle belgesinin metnini / sırasını değiştirmek (DB’de veya cache’te “sessiz patch”).
- “Düzeltme oldu” diye geçmiş entry’yi silmek.

### 3.2 İzin verilen restore modelleri (biri seçilmeli, dokümante)

| Model | Açıklama |
|--------|-----------|
| **A — Supersession chain** | Yeni entry: `supersedesEventId` + kısa gerekçe kodu; UI varsayılan “güncel beat” gösterir, geçmiş **genişletilebilir** |
| **B — Correction seal** | SR-1 §8’deki gibi tek **seal** event chronicle’a; önceki world iddiası **tarihsel** kalır |
| **C — Read model rebuild** | Chronicle append değişmez; **Chronicle Read View** (türetilmiş) yeniden hesaplanır — view versiyonu artar |

**Kural:** Kullanıcı “ne oldu?” dediğinde timeline **boşluk veya silik** göstermez; ya eski + yeni beat ya da açık “rebuild view v2”.

---

## 4. Trust memory: kullanıcı tarafı

### 4.1 Çelişki senaryosu

- Kullanıcı A dünyayı hatırlar (yanlış frame); sistem B’ye düzeltti (SR-1).
- Chronicle’da eski iddia **tarihsel** olarak duruyor; yeni seal “B doğrulanır” diyor.

### 4.2 Normalize UX (zorunlu davranış seti)

| Davranış | Açıklama |
|----------|-----------|
| **Tek geri bildirim** | SR-1 L3’ten sonra, Chronicle yüzeyinde **aynı correlation** için tek “doğrulama özeti” kartı (i18n) |
| **Tarihsel genişlet** | Varsayılan dar görünüm; “önceki kayıt” okunabilir — **sansür yok** |
| **Companion (opsiyonel)** | Tek cümle: “Kayıtlı hikâyende önceki kare güncellendi; güncel kare şu.” (Companion-first ile uyumlu) |

### 4.3 Yasak

- Kullanıcı hafızasını “sıfırla” komutu ile chronicle’ı rewrite etmek.
- Eski beat’i UI’da **hiç listelememek** (un-personing) — yalnızca açık “gizle filtre” ürün kararı ile.

---

## 5. SR-1 ile birleşik alan

| SR-1 çıktısı | TMC-1 karşılığı |
|----------------|-----------------|
| `semantic_recovery_log` / seal | Chronicle’a **append** veya read-model `viewVersion++` |
| `recovery.phase === 'corrected'` | Chronicle beat veya özet kart tetiklenir |
| `reasonCode` | Chronicle entry’de **makine kodu**; kullanıcıya `userMessageKey` |

---

## 6. Operasyon ve uyumluluk

- **Audit:** Regulator / destek için “rewrite yok” kanıtı = append-only + supersession zinciri.
- **Drift:** [RDCL §8](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md#8-drift-detection-layer) ile uyumlu — drift çözümü chronicle’ı **değiştirmez**, yeni doğrulama event’i ekler.

---

## 7. Yol haritası (özet)

1. RDCL — **truth** (hesaplanan state)  
2. WC-PF — **stability** (arıza altı tutarlılık)  
3. OWIS — **perception** (world projection)  
4. SR-1 — **meaning** (anlık anlama onarımı)  
5. **TMC-1 — memory** (zaman içinde tutarlı hikâye + kullanıcı hafızası) — bu belge  
6. **AIL-1** — **[Agency & Intent Shaping](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)** (müdahale / co-evolution; olay append ile TMC uyumu)

Üst çatı isimlendirme: **[ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)** · [Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md).

---

## 8. İlişkili belgeler

- [Semantic Recovery SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md)  
- [World consistency under partial failure (WC-PF)](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)  
- [Epistemic Continuity Runtime (ECR)](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)  
- [ECR Execution Model](RHIZOH_ECR_EXECUTION_MODEL_V1.md)  
- [AIL-1 — Agency & Intent Shaping](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)  

---

*Trust Memory Consistency V1 — düzeltildi görüldü; hikâye rewrite edilmedi.*
