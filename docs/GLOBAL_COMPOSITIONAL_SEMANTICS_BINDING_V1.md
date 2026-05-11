# Global Compositional Semantics Binding Layer (CSB-1)

**Rol:** Dört ayrı anlam katmanını **tek bir bileşik okumaya** kilitleyen sözleşme: **PAL** (cebirsel), **GCR + EQR** (zamansal), **EWM** (anlamsal kapanış) — artı **GBS-VG** (boot **yürütme** sırası). Bu belge *yeni hakikat üretmez*; **compose edilebilir girdi/çıktı tiplerini** ve **ortak çapa** (anchor) koşullarını tanımlar.  

**Epistemic OS bağlamı:** **EMCS** hukuku, **CSB** bileşik anlamı, **EBVM** yürütümünü, **GDK** zamanını tanımlar; **cross-layer determinism** [`GDK-1` §6](GLOBAL_DETERMINISM_KERNEL_V1.md) ile kapanır; **committed trace** sınırı [`MK-1`](MK1_KERNEL_VALIDATOR_V0_1.md) ile ([`EMCS-1` §14](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md), [`EBVM-1`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md), [`GDK-1`](GLOBAL_DETERMINISM_KERNEL_V1.md)).  
**Durum:** `PLANNED` — mimari birleştirici katman; alan adları şema sürümleriyle somutlaşır.  
**Sürüm:** CSB-1  
**İlişkili:** [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) (**EMCS-1**) · [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md) (**EBVM-1**) · [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) (**GDK-1**) · [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) (**MK-1** — trace commit standardı) · [`GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) · [`GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md`](GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md) · [`GLOBAL_CONSISTENCY_RECONCILIATION_V1.md`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) · [`EPISODIC_QUERY_RECONSTRUCTION_V1.md`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) · [`EPISODIC_WORLD_MODEL_INTEGRATION_V1.md`](EPISODIC_WORLD_MODEL_INTEGRATION_V1.md) · [`GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md`](GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md) · [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md)

---

## 1. Üçlü + eksik parça

| Katman | Anlam sınıfı | Örnek taşıyıcı |
|--------|----------------|----------------|
| **GBS-VG-1** | Boot **execution semantics** — faz sırası, fail-fast | `IDLE → … → ACTIVE` |
| **GBS-PAL-1** | Gate **algebraic semantics** — `G0∧…∧G3`, witness DAG | `Witness_0…3`, `WorldCandidate` |
| **GCR-1** | **Temporal semantics** (çoklu kaynak / epoch **yakınsama**) | `ReconcileWitness`, CRA seti |
| **EQR-1** | **Temporal semantics** (deterministik **geri okuma** / plan) | `planId`, reconstruction path |
| **EWM-1** | **Compositional / semantic closure** (çok boyutlu kısıt uzayı) | constraint vektörü + gap manifesti |

**Eksik olan:** Bu parçaların **ürününde** nasıl tek bir **geçerli dünya okuması** elde edildiği — işte **CSB-1**.

---

## 2. Tek fonksiyon okuması (Bind)

**Hedef imza (soyut):**

`Bind : (A_boot, A_temp, A_ret, M_ewm) → ValidityBundle | CSB_ERR_*`

| Bileşen | Kaynak katman | Anlam |
|---------|----------------|--------|
| `A_boot` | VG + PAL | `WorldCandidate` + `Witness_0…3` — **bounded ACTIVE** öncesi/sonrası tanık |
| `A_temp` | GCR | İlgili epoch / CRA kümesi için **reconcile** tanığı |
| `A_ret` | EQR (+ GEMC pointer’ları) | `planId` + **deterministik** reconstruction adımları; `epochWindow`, gap kodları |
| `M_ewm` | EWM | Bildirilen model sürümü + **kısıt şablonları** (vektör boyutları) |

**Çıktı `ValidityBundle`:** salt okunur **birleşik tanık** — “bu dörtlü, aynı **anchor** altında birlikte tutarlıdır” iddiası (**mutlak ispat değil**; tanımlı invariant’lar altında **constraint satisfaction**).

**İhlal:** `CSB_ERR_*` — bileşim ihlali (anchor uyumsuzluğu, plan–rollup çakışması, EWM projeksiyon reddi, vb.); alt kodlar CSB amendment’ında keskinleşir.

### 2.1 CSB normal form (`ValidityBundle` / `Bind` çıktısı)

**Amaç:** Aynı anlamsal sonuç **tek** serileştirme ile ifade edilsin; hash/replay tutarlı olsun ([`GDK-1`](GLOBAL_DETERMINISM_KERNEL_V1.md)).

| Katman | Kural |
|--------|--------|
| **Canonical ordering** | Tüm nesne anahtarları **lexicographic sort**; diziler **semantik sıra** korunur (bacak sırası değişmez). Serileştirme: stable UTF-8 JSON (EBVM ile aynı aile). |
| **Normalization layer** | `null` vs alan yokluğu **tek kurala** indirgenir (tercihen: opsiyonel alan yok = alan yok); sayılar **tam** temsil (kayan nokta yalnız politikaysa); tarih ISO8601 UTC. |
| **Ambiguity collapse rule** | İki yüzey biçimi aynı anlamı taşıyorsa (ör. eşdeğer boş `epochWindow` ifadeleri), **tek canonical** forma **collapse**; çökertme tablosu CSB amendment’ında listelenir. |

**İhlal:** Çökertilemeyen çift anlam → `CSB_ERR_PACK` veya `GDK_ERR_INPUT_NON_CANONICAL` (lift politikası).

---

## 3. Ortak çapa (composition anchor)

Bileşim **ancak ortak bir `Anchor`** üzerinde tanımlıdır (örnek alanlar; somut isimler PAL/EWM şemasında sabitlenir):

- `commitSnapshot` / genesis benzeri kök  
- **GEMC** rollup kimliği (storage leg)  
- **EQR** `planId` üretimine giren canonical sorgu özeti  
- **GCR**’ın değerlendirdiği CRA / epoch kümesinin üst sınırı  

**Kural:** `A_boot`, `A_temp`, `A_ret` farklı anchor gösteriyorsa **Bind çağrısı geçersizdir** — sessiz birleştirme yok (primary aile: `CSB_ERR_ANCHOR`; alt: `ANCHOR_MISMATCH`).

---

## 4. Faktörleştirme (nasıl compose ediliyor?)

Okunabilir sıra — **yürütme sırası** VG ile uyumlu; **cebir** PAL ile; **zaman** GCR+EQR ile:

```
Boot leg:     VG_exec  ∘  PAL_algebra   →  W_boot
Temporal leg: GCR ∘ (GEMC anchors)     →  W_temp
Retrieval leg: EQR(planId physics)      →  W_ret
Closure leg:  EWM.project(W_boot, W_temp, W_ret, M_ewm) →  v_semantics
```

`Bind` **tek fonksiyon** olarak:

`Bind = EWM.project ∘ Pack(W_boot, W_temp, W_ret)`

Burada `Pack`, üç tanığı **aynı Anchor** üzerinde **ürün tipine** oturtur; `EWM.project`, **vektörleştirilmiş kısıt tatmini** üretir ([`EWM-1`](EPISODIC_WORLD_MODEL_INTEGRATION_V1.md), [`GBS-VG-1` Gate 3](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md)).

**Monotonluk:** Her bacak kendi içinde **daraltıcı** veya **tanıklayıcı**dır; `Bind` **yeni operasyonel state yazmaz** — yalnızca **birleşik geçerlilik** raporu.

---

## 5. Associativity (Pack ve düzleştirme)

**Taşıyıcı:** Aynı `Anchor` altında, bacak tanıkları alan adlarıyla **ayırt edilir** (`boot.*`, `temp.*`, `ret.*`, …); çakışan alan = `CSB_ERR_PACK_FIELD_COLLISION`.

**İkili birleştirme:** `Pack2(x, y)`, iki uyumlu tanığı **ürün** tanıkta birleştirir (salt okunur birleşim).

**Associativity kuralı:** Aynı üçlü `(W_boot, W_temp, W_ret)` için

`Pack2(Pack2(W_boot, W_temp), W_ret) ≡ Pack2(W_boot, Pack2(W_temp, W_ret))`

**ancak ve ancak** her iki yanda da ara ürünler **aynı Anchor + aynı alan birleşimi** ile **kanonik düzleştirme** (canonical flatten) sonucu **bit-bit aynı** ürün tanığı verir. Uygulama, her zaman **tek canonical flatten** (ör. önce boot∥temp, sonra ret; veya tek geçişte üçlü) kullanmalıdır; farklı iç içe sıra **farklı ara normalizasyon** üretirse `CSB_ERR_PACK_NON_ASSOCIATIVE_NORMALIZATION`.

**`Bind` ile ilişki:** `Bind` yalnızca **düzleştirilmiş üçlü** üzerinde tanımlıdır; iç içe `Pack` sırası **dışarıda** associativity’yi sağlamalıdır.

**Not:** `EWM.project` **Pack2’nin parçası değildir**; §7’deki commutativity kısıtına bakın.

---

## 6. Identity element (varsa)

**Genel özdeslik:** Tam `Bind` için **evrensel birim yok** — eksik bacak **identity ile doldurulamaz**; bu durum `CSB_ERR_LEG_MISSING` (veya ilgili alt kod).

**Yerel (degenerate) birimler — koşullu:**

| Bağlam | Olası “birim” | Koşul |
|--------|----------------|--------|
| Zamansal bacak | GCR’ın “no-op reconcile” tanığı | GCR-1 + PAL’de **açık** izin + `epochWindow` boşluğu tanımlı |
| Retrieval bacak | EQR’ın **boş / trivial plan** tanığı | EQR-1’de degenerate plan sözleşmesi; `planId` yine deterministik |
| Boot bacak | **Yok** | `W_boot` her zaman VG+PAL ürünüdür; sahte “boş boot” yasak |

Bu degenerate tanıklar **CSB_LOCAL_ID** (veya şema alanı `localIdentity: true`) ile işaretlenir; **Anchor ve alan bütünlüğü** yine zorunludur. Özdeslik, **scalar 1** gibi değil; yalnızca “bu bacak bu pencerede ek kısıt getirmiyor” demektir.

**Bileşen birim yoksa:** İlgili bacak için normal tanık zorunludur.

---

## 7. Projection commutativity constraints

**Zorunlu sıra (global):**

`Pack` (tam düzleştirilmiş üçlü) **önce** · `EWM.project` **sonra**.

`EWM.project ∘ Pack ≠ Pack' ∘ EWM.project` — **ikinci form yasak** (anlamsal kapanış önce uygulanamaz). İhlal: `CSB_ERR_PROJECT_BEFORE_PACK`.

**Bacak sırası (Pack içi):** `W_boot`, `W_temp`, `W_ret`’in **ürün tipine oturtulma sırası** uygulama tarafından **tek canonical sıra** ile sabitlenir (öneri: boot → temp → ret). Sıra değişimi, ara normalizasyonu değiştiriyorsa §5 associativity ihlaline düşer.

**EWM iç projektörler:** `M_ewm` altında boyut projektörleri `π_i` yalnızca **bağımsız boyutlar** için yer değiştirebilir; bağımlılık grafiği EWM-1’de tanımlı değilse **sabit sözlük sırası** zorunludur (`CSB_ERR_EWM_PROJECTION_ORDER`).

**GCR / EQR:** Aynı `epochWindow` üzerinde **önce** GCR reconcile tanığının **retrieval önkoşulu** olarak kullanılıp kullanılmayacağı [`EQR-1`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) / [`GCR-1`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) ile sabitlenir; CSB **commute etmez** — önkoşul ihlali `CSB_ERR_TEMP_RET_ORDER` veya bacak-spesifik lift.

---

## 8. CSB_ERR closure semantics

**Kapalı hata ailesi:** Her `Bind` başarısızlığı, aşağıdaki **üst ailelerden** tam olarak birine **lift** edilir; alt kodlar bu ailenin içinde **refine** edilir (çoklu üst aile raporu **yasak** — tek primary).

| Üst aile | Anlam |
|----------|--------|
| `CSB_ERR_ANCHOR` | Çapa uyumsuzluğu, eksik anchor alanı |
| `CSB_ERR_MANIFEST` | Geçersiz veya eksik `EngineManifest` / VG önkoşulu ([`EMCS-1`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md)) |
| `CSB_ERR_PACK` | Associativity / alan çakışması / normalizasyon |
| `CSB_ERR_LEG_BOOT` | Boot tanığı / PAL / VG ihlali (lift: `GBS_ERR_*`) |
| `CSB_ERR_LEG_TEMP` | GCR / temporal ihlali |
| `CSB_ERR_LEG_RET` | EQR / retrieval / `planId` ihlali |
| `CSB_ERR_EWM` | Projeksiyon, sıra, vektör boyutu, gap politikası |
| `CSB_ERR_VM_REPLAY_MISMATCH` | **Execution divergence / trace inconsistency / VM drift** — yürütüm geçmişi uyuşmazlığı ([`EBVM-1` §6](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md)) |
| `GDK_ERR_*` | **Determinizm çekirdeği** — saat ayrışması, sanitize ihlali, gözlemci sızıntısı ([`GDK-1`](GLOBAL_DETERMINISM_KERNEL_V1.md); lift: `CSB_ERR_PACK` / `CSB_ERR_MANIFEST` / `CSB_ERR_VM_*`) |
| `MK1_ERR_*` | **Trace commit standardı** — edge `K`, ANF kimlik, injektif clock, GECS, root hash ([`MK-1`](MK1_KERNEL_VALIDATOR_V0_1.md); lift: `CSB_ERR_VM_REPLAY_MISMATCH` / `GDK_ERR_*` / `CSB_ERR_MANIFEST`) |
| `CSB_ERR_PROJECT_BEFORE_PACK` | §7 ihlali (isteğe bağlı `CSB_ERR_PACK` altında toplanabilir) |

**Kapanış kuralları:**

1. **Total function (mümkün olduğunca):** Geçerli girdide `Bind` ya `ValidityBundle` ya da **tek** `CSB_ERR_*` primary döner; belirsiz çoklu kök hata **yasak** (ilk ihlal eden bacak kazanır — deterministik öncelik: Anchor → Pack → boot → temp → ret → EWM).  
2. **Lift closure:** Alt sistem kodları (`GBS_ERR_*`, `EQR_*`, GCR rapor kodları) **her zaman** yukarıdaki bir `CSB_ERR_LEG_*` veya `CSB_ERR_ANCHOR` altına **map** edilir.  
3. **Gap ≠ success:** `EQR_EPOCH_GAP` vb. **açık gap**, `ValidityBundle` içinde **gap manifesti** olarak taşınabilir; **sessiz başarı** değildir (EWM vektörü “gap boyutu”nu işler). Gap’i kapatmadan “tam geçerli” iddiası **CSB_ERR_EWM** veya `CSB_ERR_LEG_RET` ile reddedilir (politika `M_ewm`’de).  
4. **Refinement stability:** Aynı girdi + aynı sürümler → aynı primary `CSB_ERR_*` (deterministik hata kimliği).

---

## 9. Zamansal bacakta GCR ve EQR

- **GCR:** “Bu **zaman diliminde** çoklu kaynaklar **yakınsıyor mu**?” — [`GCR-1`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md).  
- **EQR:** “Aynı anchor’dan **nasıl** deterministik okunuyor?” — [`EQR-1`](EPISODIC_QUERY_RECONSTRUCTION_V1.md).

İkisi **aynı temporal semantics ailesinde**; CSB bunları **aynı `epochWindow` / witness zinciri** ile `Pack` içinde hizalar. **EQR_EPOCH_GAP** / **GCR** çatışması, `Bind` seviyesinde **açık** hata veya gap manifestine düşer (sessiz doldurma yok).

---

## 10. PAL ve VG’nin yeri

- **PAL:** Hangi alanların `W_boot`’a girebileceğini **tipler**; VG bu sırayı **çalıştırır**.  
- **Bind** boot bacak için **PAL sonrası** `W_boot` üretimini varsayar; VG olmadan sadece cebirsel hayal kurulamaz.

---

## 11. ETSS ile uyum

CSB **TAL / ECG / CIL** çökertmez: yalnızca **mevcut yüzeylerden gelen tanıkların** ürününü bağlar. ECG **export** ve CIL **invariant** girdileri **EWM** üzerinden veya doğrudan `M_ewm` kapsamına girer ([`ETSS-1`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md)).

---

## 12. Formal completeness (CSB closure consistency)

Burada **“proof”** matematiksel hakikat ispatı **değil**; **closure kurallarının iç tutarlılığı** ve **kapsama** iddiasıdır (bu belgenin üst kısmındaki **constraint language** çerçevesi).

| Kavram | CSB-1 anlamı |
|--------|----------------|
| **Completeness (kapsama)** | Her `Bind` sonucu ya **kanonik** `ValidityBundle` ya da §8’deki **üst ailelerden tam birine** ait **tek** primary `CSB_ERR_*` ile raporlanır; **tanımsız çıktı** yok. |
| **Soundness (sağlamlık)** | `ValidityBundle` üretildiyse: ortak `Anchor` tutarlıdır; bacak tanıkları **lift** kurallarına uygundur; EWM vektörü `M_ewm` politikasına göre **bounded validity** taşır (yeni hakikat üretimi iddiası yok). |
| **Consistency (çelişkisizlik)** | §8 öncelik sırası **tek** primary kod üretir; aynı girdi + sürüm → aynı sonuç sınıfı (**refinement stability**). Associativity (§5) ve projection sırası (§7) birlikte **Pack ∘ project** çelişkisi oluşturmaz. |
| **Closure (kapanış)** | Alt sistem hataları (`GBS_ERR_*`, `EQR_*`, GCR kodları) **daima** `CSB_ERR_LEG_*` / `CSB_ERR_ANCHOR` altına map edilir; **açıkta kalan** kod = spec ihlali. |

**Kanıt yükü:** Implementasyon, yukarıdaki dört satırı **test / harness** ile doğrular; “theorem prover” beklentisi yok.

---

## 13. Execution semantics mapping (`Bind` → runtime evaluator)

**Soyut:** `Bind` — §2–§4’teki imza ve §5–§8 cebiri.  
**Somut:** **Runtime evaluator**, aynı sözleşmeyi **yürütülebilir** fazlar + deterministik çıktı ile uygular.

| `Bind` kavramı | Runtime karşılığı (eşleme hedefi) |
|----------------|-----------------------------------|
| `VG_exec ∘ PAL` | Boot orchestrator — [`GBS-VG-1`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) faz makinesi + [`GBS-PAL-1`](GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md) witness şeması |
| `GCR` bacak | Salt okunur reconcile — örn. `npm run epistemic:gcr-reconcile` · [`GCR-1`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md) |
| `EQR` bacak | Plan derleyici — örn. `npm run epistemic:eqr-plan` · [`EQR-1`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) |
| `GEMC` anchor | Rollup manifest — örn. `npm run epistemic:gemc-manifest` · [`GEMC-1`](GLOBAL_EPISODIC_MEMORY_CONSOLIDATION_V1.md) |
| `Pack` / canonical flatten | Tek süreç içinde tanık birleştirme + alan normalizasyonu (CI veya boot daemon) |
| `EWM.project` | EWM motoru / doğrulayıcı (şu an **PLANNED**; stub → tam motor) |

**Evaluator imzası (hedef):**

`evaluateBind : (ConcreteInputs, EngineManifest) → ValidityBundle | CSB_ERR_*`

`EngineManifest`: [`EMCS-1`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) constitution nesnesi; script / `M_ewm` sürüm alanları eklenebilir — **aynı manifest + aynı GDK-normalize girdi + aynı clock politikası → aynı** bundle veya **aynı** primary hata ([`evaluateBind`](../scripts/evaluateBind.mjs), [`GDK-1`](GLOBAL_DETERMINISM_KERNEL_V1.md)).

**Uygunluk (adequacy):** Runtime, `evaluateBind` ile **soyut** `Bind`’i **refine** eder; sapma = bug veya §12 consistency ihlali.

---

## 14. Sonraki adımlar

- **GDK-1** — hash clock, sanitize, observer isolation; EBVM/EMCS ile **tek timeline** ([`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md)).  
- §2.1 **CSB normal form** için **ambiguity collapse** tablosu + JSON Schema.  
- `ValidityBundle`, `EngineManifest` ve `CSB_ERR_*` için **JSON şema** (sürümlü).  
- `Anchor` alanlarının **PAL §5** ve **EQR canonical query** ile bire bir eşlemesi.  
- `evaluateBind` için **referans stub** (mevcut `npm run epistemic:*` parçalarını Pack eden salt okunur script) — ayrı amendment.  
- §12 **closure consistency** için **regression harness** (kasıtlı lift / öncelik senaryoları).

---

## 15. Mutation policy

CSB-1 **append-only**; `Bind` imzası veya anchor kuralları genişlerse **CSB-2** veya yeni bölüm.

---

*CSB-1 — Compositional semantics binding: PAL + GCR + EQR + EWM under a single Anchor and ValidityBundle.*
