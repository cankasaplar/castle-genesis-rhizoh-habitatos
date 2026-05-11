# Global Determinism Kernel (GDK-1)

**Rol:** **EBVM + CSB + EMCS** dörtlüsünün **aynı global sıraya** (ordering) bağlanmasını zorunlu kılan **ispat sınırı** — ve pratikte **runtime safety kernel**: yalnız spec değil; **clock consistency** ihlalinde sistemin **operasyonel olarak** güvenli şekilde **reddetmesi / raporlaması** hedeflenir.  
**Durum:** `PLANNED` — teknik çekirdek; saat / şema alanları implementasyonda sabitlenir.  
**Sürüm:** GDK-1  
**İlişkili:** [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) · [`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) · [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) (**MK-1** — physics compliance / commit standardı)

---

## 1. Global Determinism Proof Boundary

**Hedef:** Replay ve harness’in iddiası yalnızca “aynı kod” değil — **aynı canonical execution timeline** altında **aynı trace sınıfı**.

Üç zorunlu sütun:

| Sütun | Anlam |
|-------|--------|
| **Hash clock model** | Her VM adımı ve her `Bind`/`ValidityBundle` özeti, **tek bir mantıksal saat** (`clockId` + monoton **tick**) ile etiketlenir; ayrıntı [**§5**](#5-gdk-clock-formal-spec). |
| **Non-deterministic input sanitization** | Girdi, VM’ye girmeden önce **normal forma** indirgenir ([§3](#3-non-deterministic-input-sanitization)). |
| **External observer isolation** | Dış gözlemci VM iç state’e doğrudan yazamaz ([§4](#4-external-observer-isolation)). |

**Sonuç:** Determinizm **kanıtı** (engineering sense) bu sınır içinde tanımlıdır; dışarısı “implementation undefined”.

---

## 2. Hash clock model (özet)

- **`clockId`:** Mantıksal zaman çizgisi kimliği.  
- **`tick`:** Monoton adım sayacı — üretim kuralı [**§5.1**](#51-tick-generation-function).  
- **Zincir:** `H_i = Hash(H_{i-1}, tick_i, gateId_i, stateNorm_i)` — EBVM ile hizalı.

**Kural:** EBVM replay, **aynı `clockId` + aynı tick dizisi** olmadan “pass” sayılmaz.

---

## 3. Non-deterministic input sanitization

**Normal form pipeline (Bind öncesi):**

1. JSON **canonical key order** + `undefined` / `NaN` yasağı.  
2. Bilinen nondet alanlar: ya çıkarılır ya da `explicitNondet: { type, valueHash }` ile **sabitlenir**.  
3. Metin normalizasyonu: UTF-8 NFC, satır sonu `LF` (politika).

**İhlal:** `GDK_ERR_INPUT_NON_CANONICAL` (lift: `CSB_ERR_MANIFEST` veya bacak hatası).

---

## 4. External observer isolation

- **İzinli:** Salt okunur manifest, önceden mühürlü snapshot, EBVM **record** çıktısı.  
- **Yasak:** VM çalışırken “son anda” okunan ortam değişkeni, ağ yanıtı, `Date.now()` **gizli** girdi olarak.  
- **İstisna:** İstisna **manifest’te listelenir** (`allowedExternalRefs`) — aksi halde sızıntı.

---

## 5. GDK Clock Formal Spec

### 5.1 Tick generation function

**Durum:** `clockState` = `(clockId, tick, headHash)`; başlangıç `tick = 0`, `headHash = H_init(clockId, EMCS_ref)` (politika).

**Tek adım (gate veya Pack atomu):**

`tick_{i+1} = tick_i + 1`

`headHash_{i+1} = H_step(headHash_i, tick_{i+1}, opId_i, stateNorm_i)`

- `opId_i` — EBVM **ANF** ile bağlanır ([`EBVM` §9.6.1](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#961-opid-algebraic-normal-form-anf)).  
- `H_step` — açık hash ailesi (örn. SHA-256); **GDK politika sürümü** ile sabitlenir.

**Bind / Pack çıkışı:** Son `tick` ve `headHash` **ValidityBundle** üzerinde veya ayrı `clockWitness` alanında taşınır.

### 5.2 Monotonicity proof (invariant)

**İddia (engineering monotonicity):** Aynı `clockId` altında yürütüm boyunca `tick` **kesin artan** tam sayıdır; **geri adım** veya **tick çakışması** yoktur.

**Gerekçe:**

1. `tick` yalnızca `T_tick: tick → tick+1` ile üretilir; başka üretim yolu yok.  
2. Paralel gate **yok** (referans EBVM: total order `G0…G3`).  
3. Fork / branch tick **yasak** — tek PC hattı.

**İhlal:** `tick_{j} ≤ tick_{i}` için `j > i` veya iki adım aynı `tick` → `GDK_ERR_CLOCK_NON_MONOTONIC`.

*Bu “ispat” klasik matematiksel ispat değil; **uygulama invariant’ı** + test / statik kontrol ile doğrulanır.*

### 5.3 Distributed sync model

**Hedef:** Birden fazla düğüm / süreç aynı **mantıksal** yürütümü iddia ettiğinde **tick + headHash** üzerinden **uyum** sorusu yanıtlanır.

| Mod | Semantik |
|-----|----------|
| **Single-writer clock** | Yalnız bir **clock authority** `tick` yayımlar; diğerleri **read-only** replay. Drift = authority dışı tick. |
| **Quorum witness (opsiyonel)** | Aynı `(clockId, tick, headHash)` için `k`-of-`n` tanık; çatışma → `GDK_ERR_DISTRIBUTED_CLOCK_SPLIT`. |
| **Log-structured merge** | Her düğüm yerel `tick_local` tutabilir; **global** eşleştirme `clockId` + **append-only** witness log ile; birleştirme **GCR/Epoch** katmanına delege ([`GCR-1`](GLOBAL_CONSISTENCY_RECONCILIATION_V1.md)) — GDK yalnız **EBVM hattı** için zorunlu global tick tanımlar. |

**Kural:** Dağıtık sistemde “aynı execution” iddiası = **aynı tick dizisi + aynı headHash zinciri** (veya açık eşdeğerlik sınıfı).

### 5.4 Single-writer clock theorem (engineering form)

**Bağlam:** §5.3’teki **single-writer clock** modu için “teorem” iddiası klasik dağıtık konsensüs ispatı değil — **mühendislik önkoşulu + reddetme invariant’ı**; T1 ile uyumlu operasyonel garanti.

**Önkoşullar (SW1–SW3):**

| Id | İfade |
|----|--------|
| **SW1** | Sabit `clockId` için **en fazla bir** yetkili yazar `W` `tick` geçişini **yayımlar** (append-only log / witness); diğer tüm düğümler **salt doğrulayıcı** veya replay. |
| **SW2** | Her kabul edilen adım `H_step` ile `headHash` güncellenir; fonksiyon **deterministik** ve politika ile sabit ([§5.1](#51-tick-generation-function)). |
| **SW3** | Doğrulayıcı, yayımlanan `(tick, headHash)` çiftini **yerel olarak** yeniden hesaplayabilir (aynı `opId` dizisi + aynı `stateNorm` hattı — [`EBVM` §9–10](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#9-ebvm-isa-v2-clocked)). |

#### Deterministic Clock Injectivity (DCI — engineering)

**Okuma:** SW1–SW3, pratikte şunu sabitler: sabit önkoşullarda **`H_step`** altında **`(tick, headHash)` eşlemesi injektiftir** — aynı `tick` için iki farklı kabul edilebilir `headHash` **olamaz** (aksi halde aynı girdide `H_step` iki değer üretir; SW2 ihlali).

| İfade | Anlam |
|-------|--------|
| **DCI (basit)** | `tick` **salt indeks değil** — **hash-tutarlı kausal sıra fonksiyonu** ile bağlı: her adımda `headHash` önceki zinciri + op + state normal formu ile **tekil** güncellenir. |
| **Fork** | Aynı `tick` → iki `headHash` → **geçersiz durum uzayı**; birleştirme yok — reddet ([aşağı](#rejection-invariant-mandatory)). |
| **Witness divergence** | İki uyumsuz witness → **reject**; “yarı resmi” evren yok. |

**İddia (SW — engineering):** SW1–SW3 ve P1–P4 ([§6](#6-cross-layer-determinism-theorem-csb--emcs--ebvm--gdk)) altında, iki dürüst doğrulayıcı aynı witness dizisini kabul ederse, kabul ettikleri **`(tick_i, headHash_i)`** zinciri **bit düzeyinde aynıdır**; farklı “kabul edilebilir” global tarihçe **yoktur** (`GDK_ERR_*` veya replay red hariç).

**Fork ispatı (sezgisel):** Aynı `tick = t` için iki farklı `headHash` iddiası `H_a ≠ H_b` → aynı `(headHash_{t-1}, tick, opId_{t-1}, stateNorm_{t-1})` için `H_step` **iki değer** üretir; bu **H_step determinizm** (SW2) ihlali. Dolayısıyla çift yazıcı veya bozuk witness → **en fazla biri** geçerli; diğeri **reddedilir**.

#### Rejection invariant (mandatory)

Doğrulayıcı şu durumda **asla** “pass” birleştirmez:

| İhlal | Aksiyon |
|-------|---------|
| Aynı `tick` için çakışan `headHash` | `GDK_ERR_DISTRIBUTED_CLOCK_SPLIT` (veya eşdeğer); birleştirme **yok** |
| `tick` monoton dışı veya çakışma | `GDK_ERR_CLOCK_NON_MONOTONIC` |
| Witness dışı `tick` üretimi | `GDK_ERR_CLOCK_BIND` / drift politikası |

**Sonuç:** “Tek yazar” ihlal edildiğinde sistem **sessizce tek evren** iddia etmez; **fork** görünür hale gelir ve **reject** edilir ([§7.1](#71-abstraction-leakage-spec-correct-gdk-wrong), [§11](GLOBAL_DETERMINISM_KERNEL_V1.md#11-gdk-enforcement-pipeline-runtime)).

---

## 6. Cross-layer determinism theorem (CSB + EMCS + EBVM + GDK)

**Önkoşullar (P1–P4):**

- **P1 (EMCS):** Sabit `M` manifest — `manifestVersion`, `schemaHash`, `frozenCoreHash` ve `gateMap` anlamı yürütüm boyunca değişmez (veya değişim yalnız `T_upgrade` tanığı ile).  
- **P2 (GDK):** Girdi `x` **sanitize** edilmiş; **observer isolation**; tek `clockId`; `tick` monoton.  
- **P3 (EBVM):** `runGate` **pure** (yan etki yok); ISA v2’de `runGate(M, gateId, state, tick)` ([`EBVM-1` §9](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#9-ebvm-isa-v2-clocked)).  
- **P4 (CSB):** `ValidityBundle` ve ara durumlar **CSB normal form**dadır ([`CSB-1` §2.1](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md)).

**Teorem (T1 — cross-layer determinism):**

> `(M, x, clockId)` sabit ve P1–P4 sağlandığında, referans yorumlayıcının ürettiği **ticked trace graph** (düğümler `(tick, stateHash)`, kenarlar `opId`) **tekdir**; ikinci bir kabul edilebilir trace aynı `tick` dizisi üzerinde **farklı** `stateHash` veya `headHash` üretemez (yürütüm hatası veya `GDK_ERR_*` hariç).

**GECS güçlendirmesi:** Aynı koşullarda yalnız **byte-eşitliği** değil — **aynı eşdeğerlik sınıfı** (`ρ(trace)`) deterministik; farklı yüzey aynı sınıfa düşemez ([`EBVM` §10](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#10-gecs-and-replayvmtrace-equivalence)).

**Sonuç sınıfı:** `evaluateBind` özet çıktısı (`ok` / `ValidityBundle` / tek primary `CSB_ERR_*`) aynı koşullarda **aynıdır**.

*Teorem iddiası **constraint-world** dilindedir; kanıt yükü: invariant’lar + regression + replay eşdeğerliği.*

**İmpliasyon (T1 — operasyonel):** P2’deki **monotonicity** yalnızca **yerel** kalır ve **dağıtık saat drift** **global tick** ile hizalanmazsa → T1 **matematiksel olarak** tanım içinde tutarlı görünse bile **operasyonel olarak kırılır**: iki düğüm “aynı yürütüm” sanırken **farklı execution history** üretir; replay / compliance **yalancı pozitif** riski doğar.

---

## 7. Mimari risk — tek kırılma noktası: clock consistency

**Gerçek mühendislik riski:** GDK + EBVM v2 ile **tek dominanta bağlı** varsayım:

**Clock consistency assumption** — tüm katmanlar **aynı global ordering** fikrine uyar; aksi halde sistem “formal olarak tutarlı spec’ler” ile **runtime’da drift** eden bir yığın olur.

| Senaryo | Sonuç |
|---------|--------|
| **Distributed clock drift** | Farklı düğümlerde `tick` / `headHash` anlamı **ayrışır** |
| **Monotonicity yalnız local** | Yerel `tick` artar; **global** sıra yok → T1 **operasyonel** ihlal |
| **Sonuç** | `GDK_ERR_*` / `CSB_ERR_VM_REPLAY_MISMATCH` **artmalı**; sessiz devam **yasak** (safety kernel) |

**GDK = runtime safety kernel:** Dağıtık ortamda **clock authority**, witness log veya quorum politikası ([§5.3](#53-distributed-sync-model)) **uygulanmadan** “deterministik evren” iddiası **desteklenmez**.

**Önceki uyarı (genel):** **EBVM + CSB + EMCS** aynı **deterministik saat** ve **aynı normal form** politikasına bağlanmazsa belgeler formal tutarlı kalıp **runtime** drift eder — §7 bunu **clock** ekseninde **keskinleştirir**.

### 7.1 Abstraction leakage (spec correct, GDK wrong)

**Kritik risk (§7’den sonra):** Artık baskın hata tipi yalnız **spec drift** değil — **clock drift abstraction leakage**:

| Durum | Sonuç |
|-------|--------|
| **EMCS / CSB** belge ve şema olarak doğru | Yürütülebilir “yasa” ve bileşik semantik tutarlı görünür |
| **GDK** tick pipeline’ı yanlış uygulanır (yerel saat, gizli `Date.now`, authority bypass, `H_step` uyumsuzluğu) | İki düğüm **aynı programı çalıştırdığını sanır**; farklı `tick` / `headHash` / trace sınıfı üretir |
| **Sistem görünümü** | “Doğru ama **farklı gerçeklik**” — yani **tutarlı spec**, **tutarsız universe model** |

**İlke:** GDK ihlali **sessizce normalize edilmez**; `GDK_ERR_*` veya replay red ile **yüzeye çıkar** ([§5–§6](#5-gdk-clock-formal-spec)). Aksi halde compliance ve audit **yalancı pozitif** üretir.

---

## 8. Dört katman — kesin rol tablosu

| Layer | Rol |
|-------|-----|
| **EMCS** | **Versioned law system** — yürütülebilir anayasa + semver ([`EMCS-1`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md)) |
| **CSB** | **Compositional semantics** — `Bind`, normal form, bileşik kısıt ([`CSB-1`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md)) |
| **EBVM** | **Clock-indexed execution graph generator** — ticked trace, gate geçişleri ([`EBVM-1`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md)) |
| **GDK** | **Global ordering kernel** — `T_tick`, monotonicity, dağıtık sync, T1 önkoşulları |

**Mimari kırılma (tek cümle):** Sistem artık yalnızca “fonksiyon hesaplayan” yığın değil; **DETAM** — *Deterministic Epistemic Trace Algebra Machine*: **time-indexed canonical reality generator**; tarihçe + sıra + GECS sınıfı birincil artefakt ([`EBVM` üst not](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md)).

---

## 9. Tek canonical execution timeline

`clockId` + sanitize(input) + `EMCS(M)` + `CSB normal form` + **clocked** `EBVM` — `gdkPolicyVersion` ile politika sabitlenir; **global ordering** GDK §5.3 ile **zorunlu** kılınmadan dağıtık iddia **yapılmaz**.

---

## 10. Kilit bağımlılıklar (sonraki adımlar)

Bunlar **roadmap seçeneği** değil — **çekirdek ürün bağımlılığı**: biri eksik kaldığında “dağıtık deterministik evren” iddiası **desteklenmez** ([`EBVM` §11](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#11-sonraki-adımlar), §7.1).

**A) EBVM ISA v2 canonical spec** — instruction semantics; **trace grammar** ([`EBVM` §9.4–9.7](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#94-canonical-trace-grammar-ebvm-20)); **GECS / replay** ([`EBVM` §10](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#10-gecs-and-replayvmtrace-equivalence)); ticked trace JSON Schema.  

**B) GDK enforcement runtime layer** — [`§11`](GLOBAL_DETERMINISM_KERNEL_V1.md#11-gdk-enforcement-pipeline-runtime): tick validation, drift detection, graph rejection, failure propagation (`GDK_ERR_*` → durdur, rapor, replay red; sessiz düzeltme yok).  

**C) `evaluateBind` → trace canonicalizer** — JSON canonical + GECS reducer + hash finalization ([`EBVM` §7](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#7-evaluatebind--trace-canonicalizer)); özet çıktı trace’nin **projeksiyonu**; tam tarihçe EBVM + GDK ile üretilir.  

**Ek (paralel mühendislik):** Clock Formalization Proof Layer — §5.3 **refinement** (engineering proof), `GDK_ERR_*` tam matrisi; EMCS upgrade cebiri; `T_tick` / `H_step` regression + dağıtık clock stres testleri.

**Hard boundary (freeze) — [`EBVM` §11.1](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#111-hard-boundary-spec-freeze):** ANF reducer completeness + collision layer; GDK **clock injection safety** (DCI / witness stability); GECS closure final form.

---

## 11. GDK enforcement pipeline (runtime)

**Amaç:** **Abstraction leakage**’i ([§7.1](#71-abstraction-leakage-spec-correct-gdk-wrong)) runtime’da **erken kesmek** — spec doğru olsa bile tick/hash/graph ihlali **sessizce** VM’ye sokulamaz. Pipeline, EBVM trace’ini [**GECS** / replay formal](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#10-gecs-and-replayvmtrace-equivalence) ile birlikte okur. **Birleşik commit yüzeyi:** [`MK-1`](MK1_KERNEL_VALIDATOR_V0_1.md) (`mk1Validate`) — guard sırası ve `MK1_ERR_*` ([MK-1 §6](MK1_KERNEL_VALIDATOR_V0_1.md#6-validation-pipeline-execution-semantics)).

### 11.1 Aşamalar (sabit sıra)

| Aşama | Görev | Başarısızlık (ör.) |
|-------|--------|---------------------|
| **E0 — Sanitize** | Girdi §3 normal form | `GDK_ERR_INPUT_NON_CANONICAL` |
| **E1 — Clock bind** | `clockId`, `gdkPolicyVersion`, `H_init` uyumu | `GDK_ERR_CLOCK_BIND` |
| **E2 — Tick validation** | Her adımda `tick` beklenen = önceki `+1`; çakışma yok ([§5.1–5.2](#51-tick-generation-function)) | `GDK_ERR_CLOCK_NON_MONOTONIC` |
| **E3 — opId / graph şekli** | Her kenarın `opId`’si manifest kapanışında; tek **causal** spine (referans EBVM: total order) | `GDK_ERR_OPID_UNKNOWN`, `GDK_ERR_GRAPH_SHAPE` |
| **E4 — Hash zinciri** | `headHash` yeniden hesap = taşınan değer; adım içi `stateInHash`/`stateOutHash` sürekliliği ([EBVM §10.4](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#104-hash-consistency-model)) | `GDK_ERR_HEAD_HASH_MISMATCH`, `GDK_ERR_STATE_HASH_GAP` |
| **E5 — Drift / witness** | §5.3 moduna göre authority veya tanık log ile uyum | `GDK_ERR_DISTRIBUTED_CLOCK_SPLIT`, `GDK_ERR_WITNESS_DRIFT` |

**Yayılım:** `GDK_ERR_*` → yürütüm **durdurulur** veya **replay red**; sonuç **yüzeye çıkar** (sessiz düzeltme yok). Üst katman CSB’ye lift: `CSB_ERR_VM_REPLAY_MISMATCH` veya gate hatası.

### 11.2 Drift detection

- **Yerel hesap vs taşınan witness:** Checkpoint’te `(tick, headHash)` çifti authority / log ile karşılaştırılır; sapma → drift.  
- **Split:** Aynı `tick` için iki uyumsuz `headHash` (veya iki uyumsuz `opId` dizisi) → `GDK_ERR_DISTRIBUTED_CLOCK_SPLIT`.  
- **Yerel monotonicity yanıltması:** Yerel `tick` artar ama **global** sıra yoksa ([§7](#7-mimari-risk--tek-kırılma-noktası-clock-consistency)) — drift modunda **reddet**, “pass” üretme.

### 11.3 Tick validation (detay)

- **Giriş:** İlk adım öncesi `tick_init` politika ile sabit (örn. `0` veya `1`).  
- **Adım `i`:** Kayıtlı `clockTick_i` = `tick_init + i` (doğrusal profil) veya açık `T_tick` dizisi; başka değer → red.  
- **Çakışma:** İki adım aynı `clockTick` → red.  
- **Geri adım:** `clockTick_{i+1} ≤ clockTick_i` → red.

### 11.4 Graph rejection rules (summary)

Aşağıdakiler **geçerli trace graph** sayılmaz; GDK pipeline **reject** eder:

| Kural | Anlam |
|-------|--------|
| **R1 — Monotonicity** | Tick dizisi §5.2 ihlali |
| **R2 — Süreklilik** | `stateInHash_{i+1} ≠ stateOutHash_i` (tek iş parçacığı / tek state hattı) |
| **R3 — opId closure** | `opId` manifest + `gdkPolicyVersion` altında türetilemiyor ([EBVM §9.6](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#96-opid-binding-rules-canonical)) |
| **R4 — Kenar üretimi** | §9.7 ile uyumsuz: eksik kenar, fazladan causal kenar, yasak dallanma (politikasız) |
| **R5 — headHash** | `H_step` zinciri kırık |
| **R6 — İzomorfizm sınıfı** | İki trace aynı eşdeğerlik sınıfında değil ama “pass” iddiası — GECS dışı karşılaştırma yasak ([EBVM §10](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#10-gecs-and-replayvmtrace-equivalence)) |

---

## 12. Mutation policy

GDK-1 **append-only**; §5–§7 anlamı geri alınamaz; değişim **GDK-1.1** veya major.

---

*GDK-1 — Global ordering + runtime safety: determinism proof boundary for the epistemic kernel.*
