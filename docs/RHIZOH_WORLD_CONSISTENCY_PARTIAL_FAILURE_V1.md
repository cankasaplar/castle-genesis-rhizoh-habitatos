# Rhizoh — World Consistency Under Partial Failure (WC-PF) (V1)

**Rol:** [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md) tamamlandıktan sonraki **doğal kırılma** — sistem deterministik dünya üretirken **kısmi arıza** altında **tutarlılık** ve **kurtarma** sözleşmesi. Bu belge **mutlu yol** değil; snapshot çöküşü, **kısmi replay**, **sıra dışı kurtarma** ve **broadcast gecikmesi** altında kullanıcıya ve operasyona **ne garanti edilir** sorusunu yanıtlar.

**Önkoşul:** RDCL kapanmış kabulü — `F(eventSlice) = state`, `G(state) = world` deterministik; [Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md) hedefleri üretimde.

**Normatif üst belgeler:** [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) · [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)

**Durum:** `NORMATIVE_TARGET`

---

## 1. Soru (tek cümle)

**“Kısmi başarısızlık altında dünya hâlâ tutarlı mı — yoksa sessizce sapıyor mu?”**

RDCL **deterministik mutlu yolu** kapatır; WC-PF **arızalı yolu** kapatır.

---

## 2. Tutarlılık türleri (ayırmak şart)

| Tür | Kapsam | Güç |
|-----|--------|-----|
| **Event integrity** | Log + şema + reject | Zaten var ([Closure patch](RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md)) |
| **State linearizability** | Aynı `correlationId` için projection sırası | RDCL (ORDER + STATE) |
| **World presentation** | UI’nin gösterdiği OWIS / embed | RDCL (WORLD) |
| **Outbound eventualness** | YouTube / live / feed gerçek dünyası | Zayıf tutarlılık — **lag** beklenir |

**Kural:** **State** için güçlü invariant; **broadcast** için **bounded staleness** + açık durum makinesi (kullanıcıya yalan yok).

---

## 3. Dört arıza sınıfı (normatif tehdit modeli)

### 3.1 Snapshot crash

**Tanım:** `rhizoh_projection_state` (veya eşdeğer) yazımı yarım kaldı, bozuk JSON, hash uyuşmazlığı veya atomik olmayan patch.

**Hedef invariant:**

- Her snapshot commit **atomik** (tek belge yazımı veya transaction) + `stateContentHash` **commit sonrası** tekrar hesaplanıp alan olarak yazılır.
- Okuyucu: `hash` alanı yoksa veya `lastAppliedSequence` ile payload çelişiyorsa belge **“corrupt / incomplete”** statüsünde; world **degraded** moduna geçer (aşağı §5).

### 3.2 Partial replay

**Tanım:** Replay sadece `[1..k]` event’i uyguladı; `k+1..n` henüz yok veya worker öldü.

**Hedef invariant:**

- `lastAppliedSequence` her zaman **uygulanmış son contiguous** prefix’i gösterir (boşluk politikası tek tip: ya **dur** ya da **explicit gap token** — sessiz atlama yok).
- UI: `replayIncomplete: true` gibi görünür bayrak ile **eksik dünya** gösterilir; tamamlanmış state ile karıştırılmaz.

### 3.3 Out-of-order recovery

**Tanım:** Geç gelen event, zaten uygulanmış sequence’ı ihlal ediyor veya DLQ’den sonra yeniden sıraya girdi.

**Hedef invariant:**

- **Tek yazar** projection: geç gelen event ya **reddedilir** (versiyon/sequence çakışması), ya da **deterministik rebase** kuralı (ürün kararı, belgede tek) ile yeniden `F` çalıştırılır.
- “Son yazan kazanır” **yasak** — bu **silent divergence** üretir ([RDCL map §8](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)).

### 3.4 Broadcast lag

**Tanım:** `state` içinde `liveEmbedRef` hazır; harici platform gecikmeli veya witness geç geliyor.

**Hedef invariant:**

- **State truth** ile **outbound witness** ayrı alanlar: UI, embed’in **pending / live / failed** durumunu state’ten okur; OWIS fazı **yalanlamaz** (faz = reducer çıktısı; “YouTube henüz hazır değil” ayrı alt durum).
- **Bounded staleness:** `witnessStaleAfterMs` aşımında operasyonel alarm + kullanıcıya “bağlantı gecikiyor” (ürün kopyası OWIS-1 ile hizalanır).

---

## 4. Kurtarma stratejisi (yüksek seviye)

| Aşama | Aksiyon |
|--------|---------|
| **Tespit** | Drift layer + snapshot self-check + sequence gap taraması |
| **İzolasyon** | Etkilenen `correlationId` için projection kilidi (diğer oturumlar çalışır) |
| **Rebuild** | Event log’dan `lastKnownGoodSequence` sonrası **tam** replay (idempotent reducer) |
| **Doğrulama** | Yeni `stateContentHash`; drift raporu kapatılır veya eskalasyon |

---

## 5. Degraded world contract (UI / OWIS)

RDCL’de “tek state’ten render” şartı korunur; WC-PF şunu ekler:

- **Normal:** `worldMode: "live"`
- **Partial replay / gap:** `worldMode: "stale"` veya `"rebuilding"` — skeleton/anchor katmanları OWIS-1’e uygun **güvenli** düşüş
- **Snapshot corrupt:** `worldMode: "error"` — yeniden yükleme / destek akışı; **rastgele** eski cache gösterilmez

---

## 6. Broadcast ve state ayrımı (lag altında tutarlılık)

- **Reducer** yalnız **intent + index** ile state üretir (URL bilgisi tutarlı).
- **Harici gerçek** (stream açıldı mı) **witness** ile gelir; gecikince state **pending** kalır — state’i witness için **geri alma** (rollback) ancak açık “revocation” event’i ile.

---

## 7. Yol haritası (RDCL → WC-PF → SR-1 → TMC → ECR → AIL)

1. **RDCL:** `F`, `G`, sıra, hash, drift **mutlu yol**.  
2. **WC-PF:** Aynı yapının **arıza modları**, tutarlılık ve **motor** kurtarma politikası.  
3. **SR-1 (meaning):** Kurtarma sonrası kullanıcının **ne gördüğü / ne anladığı** — **[Semantic Recovery V1](RHIZOH_SEMANTIC_RECOVERY_V1.md)**.  
4. **TMC-1:** Chronicle rewrite yok, restore = append; hatırlama normalize — **[Trust Memory Consistency](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)**.  
5. **ECR:** Çatı isim — **[Epistemic Continuity Runtime](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)**.  
6. **AIL-1:** **[Agency & Intent Shaping](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)** — intervention loop (co-evolution).

---

## 8. İlişkili belgeler

- [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)  
- [FER-1 Production Closure Blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md)  
- [Drift (RDCL §8)](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md#8-drift-detection-layer)  
- **[Semantic Recovery SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md)** (WC-PF sonrası zorunlu kırılma)  
- **[Trust Memory Consistency TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)** · **[ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)** · **[AIL-1](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)**

---

*WC-PF V1 — world consistency under partial failure; RDCL sonrası eşik.*
