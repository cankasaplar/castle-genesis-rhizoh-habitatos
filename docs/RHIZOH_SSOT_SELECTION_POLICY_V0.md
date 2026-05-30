# Rhizoh SSOT Selection Policy (V0)

**Tür:** ürün / mimari **politika** — **yürütme motoru değil**. Kod bu belgeyi otomatik uygulamaz; charter, review ve sonraki implementasyon için **karar çerçevesi**dir.  
**İlişki:** Kimlik envanteri ve binding haritası: [`RHIZOH_SESSION_IDENTITY_INVENTORY_V0.md`](RHIZOH_SESSION_IDENTITY_INVENTORY_V0.md).

---

## 1. Kapsam ve olmayanlar

**Kapsar:** Hangi kimlik türü hangi **concern** (ilgi alanı) için “primary anchor” sayılır; çakışma ne zaman “politika gerektirir”; birleştirmenin **deterministik** mi **heuristik** mi olduğu.

**Kapsamaz:** Skor motoru, otomatik çakışma çözümü, kullanıcıya görünmez ID birleştirme servisi, tek global “master UUID” zorlaması.

---

## 2. Primary anchor (concern başına tek kök)

Aynı anda birden fazla “SSOT” vardır; **concern başına bir primary** tanımlanır. Bir concern’in anchor’ı diğerinin yerine **geçemez**.

| Concern | Primary anchor | Gerekçe (kısa) |
|---------|----------------|----------------|
| **Konuşma thread’i (ürün)** | `sessionId` (`loadRhizohProductSession` / `rhizohProductOrchestration`) | Faz, turn sayısı, cohort proxy — uzun ömürlü ürün oturumu |
| **Konuşma hafızası (istemci gerçeği)** | `continuityRef` + disk `rhizoh.continuity.v1` (persist sonrası) | Turn listesi ve meta; LLM continuity payload’ının kaynağı |
| **Tek LLM turu (denetim / OTEL)** | Gateway `traceId` (`randomUUID` per POST) | Sunucu üretimi; audit satırı ile bire bir |
| **Provider / anahtar seçimi** | `connectionId` (kayıtlı bağlantı) | Kimlik değil; erişim ve faturalama bağlamı |
| **Yayın / replay rotası** | `greenRoomLive.traceId` / sunucu GreenRoom trace | Ana sohbet thread’inden ayrı ürün hattı |

**Kural:** “Root” diye tek ID aranmaz; **concern başına bir primary** seçilir. Karışıklık, farklı concern’lerin aynı isimle (ör. hepsi “trace”) anılmasından gelir; politika dili concern’i önce söyler.

---

## 3. Conflict resolution — ne zaman devreye girer?

“Conflict resolution” burada **otomatik merge motoru** değil; **insan / charter review tetikleyicisi** ve implementasyon öncesi **açık karar** anlamına gelir.

| Durum | Politika: ne zaman müdahale edilir? | Not |
|-------|--------------------------------------|-----|
| **İstemci `TRC-*` vs gateway `traceId`** | UI’da aynı “tur” için iki ID görünüyorsa veya audit’te eşleme gerekiyorsa **review** | Şu an zorunlu eşleme yok; V0’da **bilinen teknik borç** |
| **LS `sessionId` vs `continuity.meta.rhizohProductSessionV1`** | `pickNewer(updatedAt)` zaten tanımlı; farklı sekme aynı anda yazıyorsa **ürün kararı** (leader tab, kilit, veya kabul edilen “last write”) | Kod bugün `pickNewer` — politika: **deterministik kural = updatedAt** |
| **`continuityRef` vs disk önden** | Çok sekme / race; kullanıcı “kaybolan tur” bildirirse **inceleme** | Kod yorumu riski işaret eder; politika: **persist öncesi tek yazım sırası** hedefi |
| **Ana sohbet `connectionId: ""` vs Studio seçimi** | “Gateway doğru anahtarı kullanmıyor” şikayeti veya prod tutarlılık sprint’i | **Ürün kararı** ile hizalanır; politika motoru değil |
| **Gateway `traceId` ile `sessionId` ilişkisiz** | Uzun vadeli audit / replay ürünü istenirse **şema genişletme** (V1+) | V0: ilişki **opsiyonel**; zorunlu değil |

**Özet tetik:** Çakışma “politika gerektirir” = **(a)** aynı concern için iki primary iddia edildiğinde, **(b)** kullanıcıya görünür tutarsızlık veya veri kaybı riski doğduğunda, **(c)** yeni özellik (WS, çok cihaz) concern sınırını geçtiğinde.

---

## 4. Merge: deterministik mi, heuristik mi?

| Birleşme noktası | Sınıf | Kural (V0) |
|------------------|-------|------------|
| **`loadRhizohProductSession` (LS vs meta)** | **Deterministik** | `updatedAt` ile `pickNewer` — aynı girdi için aynı seçim (zaman damgası güvenilir varsayımı) |
| **`persistContinuityTurn` (turn append + meta)** | **Deterministik** (sıra + append) | Son yazan `writeClientContinuity` + `syncClientContinuityRef`; yarış varsa **heuristik değil**, “son yazım” fiziksel olarak hangi tab olduysa o (ortam bağımlı) |
| **`handleExecute` persist: `traceId \|\| out.traceId`** | **Hibrit** | Öncelik sırası sabit (UI önce, gateway sonra) → **deterministik öncelik**; `out.traceId` yoksa UI kalır |
| **Gateway yeni UUID her tur** | **Deterministik üretim** | Rastgele ama çakışma çözümü değil; tur başına tek üretim |
| **Çok sekme continuity** | **Şimdilik ortam heuristiği** | Merkezi politika motoru yok; “leader tab” veya merge stratejisi **V1 ürün kararı** |

**Net cümle:** Ürün oturumu birleşimi **açıkça deterministik** (`updatedAt`); canlı çok sekme ve “hangi yazım kazandı” **ortam deterministik**, ürün politikası henüz **tek SSOT merge motoru** tanımlamaz.

---

## 5. Özet cümleler (sabitleme)

1. **Primary anchor** concern başına seçilir; global tek ID yoktur.  
2. **Conflict resolution** = review / sprint kararı tetikleyicisi; otomatik skorlama yoktur.  
3. **Deterministik merge** şimdilik `sessionId` pick + persist sırası + `traceId \|\|` önceliği ile sınırlıdır; çok sekme için **açık ürün kuralı** ileride eklenir.

---

## 6. Politika sürüm kayması ve audit lineage (bilinçli zayıf nokta)

**Sorun sınıfı:** V0’daki “primary anchor / merge sınıfı / tetik” kararları V1’de **farklı** olabilir — bu **hata değil**, ürün evrimidir; risk **resolution consistency drift over time** (aynı olaya sonradan bakıldığında farklı politika yorumu).

**Mitigasyon (motor değil, süreç):**

1. **Belge sürümü:** Dosya adı ve dipnot `V0` / `V1` taşır; üst seviye politika değişince **yeni sürüm belgesi** veya açık “diff” bölümü tercih edilir (aynı dosyada sessiz rewrite kaçınılır).  
2. **Audit lineage:** Üretim olayları kodda zaten `traceId` (gateway) ve istemci persist ile bağlanır; **politika** tarafında lineage = **git tarihçesi + PR açıklaması** + bu üçlü link zinciri (envanter → politika → runtime flow).  
3. **Regresyon review:** Davranış değişen sprint’te “hangi concern’in anchor’ı değişti?” sorusu checklist’e alınır.

**İlişki:** Gerçek birleşme anları için bkz. [`RHIZOH_RUNTIME_IDENTITY_RESOLUTION_FLOW_V0.md`](RHIZOH_RUNTIME_IDENTITY_RESOLUTION_FLOW_V0.md).

---

*V0 — SSOT seçim politikası; envanter ve kod evrimiyle revize edilir.*
