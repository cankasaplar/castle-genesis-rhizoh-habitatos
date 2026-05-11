# EvaluateBind Virtual Machine (EBVM-1)

**Rol:** `evaluateBind` yığınının birincil yüzeyi artık “salt instruction set” değil — **clock-indexed execution trace generator**: her adım **GDK `tick`** ile indekslenir; çıktı **tek canonical trace space** üzerinden okunur ([§9](#9-ebvm-isa-v2-clocked)). Inference değil; **executable semantic machine** + **tarihçe üretimi**.  

**Sistem kimliği (birleşik yığın):** **DETAM** — *Deterministic Epistemic Trace Algebra Machine*: salt VM / evaluator / semantic validator değil; **zaman-indeksli, kanonik gerçeklik-tarihi üreteci** — doğruluk **eşdeğerlik sınıfı stabilitesi** ile ölçülür ([§7](#7-evaluatebind--trace-canonicalizer), [§8](#8-epistemic-os-üçlüsü--gdk-dört-katman)).  

**Sürüm:** EBVM-1  
**Durum:** Referans: [`scripts/evaluateBind.mjs`](../scripts/evaluateBind.mjs) (`evaluateBindVm`, `replayVmTrace`), [`scripts/csbVmRecord.mjs`](../scripts/csbVmRecord.mjs), [`scripts/csbVmReplay.mjs`](../scripts/csbVmReplay.mjs), [`scripts/csbVmInspect.mjs`](../scripts/csbVmInspect.mjs).  
**İlişkili:** [`ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) · [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) · [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) (**GDK-1**) · [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) (**MK-1** — trace commit / `MK1_ERR_*`) · [`../scripts/evaluateBindIndexed.mjs`](../scripts/evaluateBindIndexed.mjs) (**sovereign πEFC** — `evaluateBindIndexed`) · [`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md) (**piEFC-1**) · [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) (**πEFC-Runtime-1.0**)

---

## 1. Kırılma: fonksiyondan sanal makineye

| Önce | Sonra |
|------|--------|
| `evaluateBind` = tek **fonksiyon** (özet sonuç) | `evaluateBindVm` = **virtual machine** |
| Salt girdi/çıktı | **PC**, **adım**, **trace**, **replay** |

**Ne anlama gelir:** Artık değerlendirme **step-based execution**; **program counter (PC)**; **traceable state transitions**; **replayable computation**. Bu, CSB’yi yalnız “doğru/yanlış” çıktısından çıkarıp **tam traceable computation system** yapar.

**Çözülen problem (mimari):** Dağıtık yürütümün ürettiği **tutarsız reality model** (`aynı iddia, farklı tarihçe`) yerine **tek canonical trace space** — yani “dağıtık execution → tutarlı, sıralı, yeniden oynatılabilir execution history” ([`GDK-1` §9](GLOBAL_DETERMINISM_KERNEL_V1.md#9-tek-canonical-execution-timeline)).

**Mühendislik sonucu (güçlü determinizm):** Yalnız “same input → same output” değil — **aynı girdi + aynı `clockId`/witness + aynı manifest** → **aynı *eşdeğerlik sınıfı*** (GECS altında `ρ(trace)`); bire bir byte eşitliği politikaya bağlı, **sınıf determinizmi** zorunlu ([§10](#10-gecs-and-replayvmtrace-equivalence)).

---

## 2. VM modeli (instruction set + durum)

| Kavram | Tanım |
|--------|--------|
| **Program** | [`EMCS-1`](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md) manifest + sabit gate sırası `G0→G1→G2→G3` |
| **ISA (referans)** | Her `gateId` + `gateMap[gateId]` → tek **op** (`runGate`); tam formal ISA → §9 |
| **PC** | Adım indeksi `0…n-1` |
| **Op** | **EBVM-1 (referans):** `runGate(manifest, gateId, state)` — yan etki yok. **ISA v2 (zorunlu okuma):** `runGate(…, clockTick)` — [**§9**](#9-ebvm-isa-v2-clocked). |

Fail anında: PC durur; referansta `stateOutHash` = `stateInHash` (çıkış genişlemez). **Dağıtık determinizm iddiası** yalnız v2 + GDK ile anlamlıdır.

**Replay determinizm sınırı:** Aynı manifest + **GDK-normalize** girdi + **hash clock** (`clockId` / tick politikası) → aynı hash zinciri ([`GDK-1`](GLOBAL_DETERMINISM_KERNEL_V1.md)).

---

## 3. Durum = execution trace graph

Durum **yalnızca** düz `inputs` / `manifest` / ara snapshot değil; birincil okuma:

**Execution trace graph** — kısıtlı durum uzayı üzerinde **deterministik graf gezintisi**: düğümler = (PC, state hash), kenarlar = gate geçişleri.

**Hesaplama:** `computation = graph traversal over constrained state space` (çıkarım değil; **izin verilen** geçişlerin izlenmesi).

---

## 4. Trace kaydı (canonical)

**EBVM-1 (mevcut referans):** Her adım: `pc`, `gateId`, `impl`, `stateInHash`, `stateOutHash`, `ok`, `detail?` — `pc` ile örtük tick (`tick ≡ pc + 1` veya `tick ≡ pc` politika).

**EBVM ISA v2 (clocked):** Her adım **açık** `clockTick` taşır; trace = **ticked graph**: düğümler `(clockTick, stateInHash)`, kenarlar `(opId, stateOutHash)` — [**§9**](#9-ebvm-isa-v2-clocked).

Hash: `sha256:` + hex, **stable UTF-8 JSON** ([`evaluateBind.mjs`](../scripts/evaluateBind.mjs)).  

Tam kayıt: `evaluateBindVm(manifest, inputs) → { vmVersion, manifestVersion, steps[], result }`.

---

## 5. Record / replay / inspect — “debug” değil, yürütüm serileştirmesi

| Araç | İşlev |
|------|--------|
| **csbVmRecord** | **Execution serialization** — yürütümün tam izi |
| **csbVmReplay** | **Deterministic recomputation** — aynı girdi/manifest ile hash zinciri eşleşmesi |
| **csbVmInspect** | **Step-level epistemic introspection** — tek adımda giriş/çıkış bağları |

Sonuç: CSB artık yalnızca çıktı hatası değil; **execution history** üzerinden tutarlılık.

---

## 6. `CSB_ERR_VM_REPLAY_MISMATCH` — yeni hata sınıfı

Bu kod **output-only** hata değildir; şunları temsil eder:

- **Execution divergence** — aynı program + girdi, farklı adım izi  
- **Trace inconsistency** — kayıtlı trace ile canlı VM uyuşmazlığı  
- **VM drift** — motor/şema/ortam sapması (politikaya göre raporlanır)

Yani hata **yürütüm geçmişi uyuşmazlığıdır** ([`CSB-1` §8](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md)).

---

## 7. `evaluateBind` → trace canonicalizer

**Konum:** Üst seviye `evaluateBind` artık yalnız “boolean + bundle” üreticisi değil; **üç katmanlı derleyici hattı** (canonicalize → trace üret → eşdeğerlik çökertme) ile **canonical execution artefaktına** bağlanır ([`GDK-1` §5](GLOBAL_DETERMINISM_KERNEL_V1.md#5-gdk-clock-formal-spec)).

| Faz | Ad | İçerik |
|-----|-----|--------|
| **Phase 1** | **Canonicalization** | JSON / state → CSB + GDK ile hizalı **normalized shape** ([§7.1](#71-json-canonical-form-before-and-after-trace)). |
| **Phase 2** | **Execution trace generation (EBVM)** | `RUN_GATE` → **typed edge emission** → ANF `opId` bağlama ([§9](#9-ebvm-isa-v2-clocked)). |
| **Phase 3** | **Equivalence collapse (GECS)** | `trace → ρ(trace, Π) →` eşdeğerlik sınıfı temsilcisi ([§7.2](#72-gecs-equivalence-reducer), [§10](#10-gecs-and-replayvmtrace-equivalence)). |
| **Final** | **Hash mühür** | Özet: **`traceFinalHash = H(chainFinal)`** — `chainFinal` son GDK `headHash`; `H` politika ile `H_meta` veya kimlik ([§7.3](#73-hash-finalization-rule)). |

- **`evaluateBind`** = aynı programın **özet sonucu** (bundle \| gate-level `CSB_ERR_*`) — trace yüzeyi olmasa bile **Phase 1** ile aynı normal forma tabidir.  
- **`evaluateBindVm`** = **Phase 2**’nin tam yüzeyi (adım trace).

Üretimde özet yeterli; **audit, regression, dağıtık eşdeğerlik** için EBVM + GECS zorunlu okuma.

### 7.1 JSON canonical form (before and after trace)

| Kural | Kaynak |
|-------|--------|
| **Object keys** | Lexicographic sort; yasak alanlar yok ([`CSB-1` §2.1](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md)). |
| **Serileştirme** | Stable UTF-8 JSON; `undefined` / `NaN` yok; sayılar JSON-safe. |
| **Metin** | UTF-8 NFC; satır sonu `LF` ([`GDK-1` §3](GLOBAL_DETERMINISM_KERNEL_V1.md#3-non-deterministic-input-sanitization)). |
| **Trace satırları** | Her `Step` ayrı ayrı canonicalize edilip öyle hash’lenir; ham “pretty print” trace **imza taşımaz**. |

**Sonuç:** İki yürütüm aynı anlamsal girdi + manifest ile aynı `stateInHash` / `stateOutHash` zincirini üretmek zorundadır; aksi halde **canonicalizer ihlali** (lift: `GDK_ERR_INPUT_NON_CANONICAL` veya `CSB_ERR_MANIFEST`).

### 7.2 GECS equivalence reducer

**Reducer** `ρ(trace, Π) → trace°` — politika `Π` (ör. `ignoreKeys`, `equivalenceMode: strict | class`):

1. **Canonical JSON** her adım ve meta üzerinde.  
2. **`ignoreKeys`** ile beyanlı alanlar (ör. `detail`, debug) kaldırılır veya sabit yer tutucuya indirgenir.  
3. **`opId`** [§9.6.1](#961-opid-algebraic-normal-form-anf) ANF üzerinden yeniden hesaplanır; yüzey `impl` **kimlik değildir**.  
4. **Çıktı:** `trace°` — **eşdeğerlik sınıfı temsilcisi**; strict replay `trace°` ile bire bir; class replay yalnız `ρ(T)=ρ(T')` kontrol eder.

Reducer **idempotent:** `ρ(ρ(T)) = ρ(T)`. İki trace aynı sınıfta ⇔ `ρ(T) === ρ(T')` (canonical byte equality).

### 7.3 Hash finalization rule

**Amaç:** Tek bir **kapı** ile “bu yürütüm bu canonical tarihçedir” mührü.

| Bileşen | Tanım |
|---------|--------|
| **`stepDigest_k`** | `H_stepFinger( canonicalStep_k )` — adımın canonical JSON’unun hash’i (politika). |
| **`chainFinal`** | Son adım sonrası GDK `headHash` ([`GDK-1` §5.1](GLOBAL_DETERMINISM_KERNEL_V1.md#51-tick-generation-function)) — **tercih edilen** finalizer (T1 ile hizalı). |
| **`traceFinalHash` (üst mühür)** | Tercih: **`traceFinalHash := H(chainFinal)`** — `H` = politika hash’i (genişletilmiş ise `H_meta(vmVersion, gdkPolicyVersion, clockId, chainFinal, …)`). Depolama / imza için **tek alan**. |

**Kural:** Raporlama veya compliance **ya** `chainFinal` **ya** `traceFinalHash` kullanır; ikisini **karıştırmadan** aynı politika dokümante edilir. GECS class replay’de eşleşme **`chainFinal`** veya politika ile **`traceFinalHash`** üzerinden; adım adım hash ile class modu **aynı anda iddia edilmez** ([§10.4](#104-hash-consistency-model)).

---

## 8. Epistemic OS üçlüsü + GDK (dört katman)

**DETAM dörtlüsü** — katmanlar **trace cebiri** üzerinde birleşir:

| Bileşen | Rol (DETAM) |
|---------|-------------|
| **EMCS** | **Law** — izin verilen evrenin anayasası ([`EMCS-1` §14](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md)) |
| **CSB** | **Binding algebra** — bileşik kısıt / `Bind` normal formu |
| **GDK** | **Time / ordering kernel** — hash-tutarlı kausal sıra ([`GDK-1` §5–6](GLOBAL_DETERMINISM_KERNEL_V1.md)) |
| **EBVM** | **Trace generator** — ANF `opId` + `K`-tipli kenar üretimi (ISA v2) |

**Matematiksel okuma (soyut):** `Execution ≈ VM(EMCS, CSB, Input)` **ancak ve ancak** `Clock = GDK(clockId, tick)` ile bağlanır — tam replay için [**cross-layer determinism** teoremi](GLOBAL_DETERMINISM_KERNEL_V1.md#6-cross-layer-determinism-theorem-csb--emcs--ebvm--gdk).

**Sistem tipi:** ❌ genel VM / evaluator / semantic validator — ✅ **DETAM** (*Deterministic Epistemic Trace Algebra Machine*): **time-indexed canonical reality generator**; birincil artefakt **execution history**; doğruluk = **eşdeğerlik sınıfı stabilitesi** (GECS).

---

## 9. EBVM ISA v2 (clocked)

### 9.1 Neden ISA v2 artık zorunlu?

**EBVM-1** trace’i `pc` ile **örtük** sıralar; bu, tek süreçte “adım sırası” için yeterlidir. **EBVM’un rolü** artık yalnız “hangi op çalıştı” değil — **clock-indexed trace generator**: her geçiş **global ordering** (`clockId`, `tick`, `headHash`) ile **bağlanmadan** dağıtık ortamda “aynı yürütüm” iddiası **operasyonel olarak anlamsız** kalır ([`GDK-1` §6–7](GLOBAL_DETERMINISM_KERNEL_V1.md)).

Dolayısıyla **ISA v2** şunları **zorunlu kılar**:

| Gereksinim | Açıklama |
|------------|----------|
| **`runGate(…, clockTick)`** | Her op, **açık tick** altında yürür; `T_tick` dışında tick üretimi yok ([`GDK` §5.1](GLOBAL_DETERMINISM_KERNEL_V1.md#51-tick-generation-function)). |
| **Deterministic `opId` binding** | Her kenar için `opId` = `f(gateId, impl, gdkPolicyVersion, …)` — **manifest + politika** ile tekil; aynı op farklı etiketle **yazılamaz** (yüzey biçimi drift’i → replay ihlali). |
| **Trace edge typing** | Kenarlar anlam olarak ayrıştırılır (aşağıdaki tablo); karıştırılmış tip → GECS / audit hatası. |
| **Replay equivalence class rules** | Aynı **anlam** / farklı **yüzey** (ör. izomorf etiketleme) **GECS** ile tek sınıfta toplanır; kanonik hash **eşdeğerlik** üzerinden tanımlanır ([§10](#10-gecs-and-replayvmtrace-equivalence)). |

### 9.2 Çekirdek semantik (imza + trace)

**Kırılma:** v1 `runGate(manifest, gateId, state)` → v2 **`runGate(manifest, gateId, state, clockTick)`** — `clockTick` GDK ile üretilir; VM **tick’i icat etmez**, **tüketir**.

| Öğe | Tanım |
|-----|--------|
| **Girdi** | `clockTick` monoton; önceki adımın `headHash` ile birlikte `H_step`’e girer (politika). |
| **Çıktı** | Gate sonucu + **sonraki** `clockTick+1` + güncellenmiş `headHash` (trace satırında zorunlu). |
| **Trace binding** | **Ticked graph**: kenar `(clockTick, opId, edgeKind?)` → düğüm `(stateHash, tick)`; v1’de `clockTick = base + pc` türetilebilir (migration kuralı). |

### 9.3 Trace edge typing (özet sözleşme)

| `edgeKind` | Rol |
|------------|-----|
| **`causal`** | Zorunlu **total-order** zinciri — `T_tick` ile uyumlu tek yürütüm hattı (gate sırası / PC). |
| **`semantic`** | Aynı **kısıt anlamı** (CSB) taşıyan geçiş; audit’te “hangi yasa ihlali” sorusuna bağlanır. |
| **`structural`** | Program şeması (EMCS `gateMap`, Pack düzeni) — **impl** yüzeyi değişse bile aynı **yapısal** rol korunur (politikaya göre `opId`’de sabitlenir). |

#### 9.3.1 edgeKind closure (final)

**Kapalı cebir:** Kenar tipleri **genişletilebilir opcode listesi** değil — **sonlu tip cebiri** `K`.

`K = { causal, semantic, structural }`.

**Closure invariant (formal):**

> ∀ `e` ∈ `TraceEdges` → `e.kind ∈ K`.

Yeni `edgeKind` **üretilemez** (runtime’da icat edilemez); yalnız **major sürüm** + GECS + GDK politikası ile **genişletilir**. Tüm geçerli trace’ler **GECS** altında normalize edilmek zorundadır ([§10](#10-gecs-and-replayvmtrace-equivalence)).

| Kural | İçerik |
|-------|--------|
| **C1 — Kapalılık** | `e.kind ∉ K` → **geçersiz trace** / `GDK_ERR_GRAPH_SHAPE` ([`GDK-1` §11.4](GLOBAL_DETERMINISM_KERNEL_V1.md#114-graph-rejection-rules-summary)). |
| **C2 — Genişletme** | Yeni üye **yalnız** EBVM **major** + **GECS closure** + **GDK `H_step`** bump ile. |
| **C3 — Doğrusal profil (referans)** | Tek causal spine; varsayılan `edgeKind = causal` ([§9.7](#97-edge-generation-rules)). |
| **C4 — GECS** | `ρ(trace)` `kind` rollerini bozmaz; yanlış spine eşlemesi yasak. |
| **C5 — Frozen semantic graph machine** | EBVM **sınırsız genişleyen VM** değil — **dondurulmuş semantik graf makinesi**: primitive’ler ve `K` sabit; davranış yeni komutlarla değil, **yalnız major + law** ile değişir. |

#### 9.3.2 Minimal core instruction set (ISA v2)

**Kritik okuma:** “Instruction set” ≠ uzun **komut listesi**. Burada instruction set = **graph generator primitive** kümesi: **1 instruction instance = 1 typed edge emission** (`kind ∈ K`).

ISA v2 **tamamlanmış minimal çekirdek** — iki yüzey:

| Primitive | İmza (semantik) | Edge |
|-----------|------------------|------|
| **`RUN_GATE`** | `RUN_GATE(manifest, gateId, state, clockTick)` → state geçişi + `ok` | Başarılı adımda **tam bir** `e` üretir: `(opId, kind ∈ K, tick)`. |
| **`HALT_FAIL`** | `HALT_FAIL(reasonCode)` | Başarısızlık **sonlandırma** primitive’i; yeni causal kenar **yok**; `reasonCode` audit / `GDK_ERR` lift için ([§9.7 G4](#97-edge-generation-rules)). |

**Trace tarafı:** Her `RUN_GATE` çağrısı en fazla **bir** yönlü kenar yayar; `HALT_FAIL` kenar **eklemez** (terminal red). **Yeni çekirdek primitive** = ISA **major**; `RUN_GATE` / `HALT_FAIL` anlamı geriye dönük **sabit** ([§9.5](#95-instruction--graph-node-mapping)).

### 9.4 Canonical trace grammar (EBVM-2.0)

**TraceRecord** (bir yürütüm kaydı):

```text
TraceRecord ::= TraceMeta StepSeq
TraceMeta   ::= { vmVersion, manifestVersion, frozenCoreHash?, clockId, gdkPolicyVersion,
                  headHashInitial? }
StepSeq     ::= Step+
Step        ::= { clockTick, pc?, gateId, opId, edgeKind, stateInHash, stateOutHash, ok, detail? }
```

**Profiller:**

| Profil | Zorunlu alanlar | Not |
|--------|------------------|-----|
| **EBVM-1.0 (referans)** | `pc`, `gateId`, `impl`, `stateInHash`, `stateOutHash`, `ok` | `clockTick` **yok**; örtük sıra `pc` ([`evaluateBind.mjs`](../scripts/evaluateBind.mjs)). |
| **EBVM-2.0** | `clockTick`, `opId`, `edgeKind`, üstteki hash alanları | `impl` yüzey alanı kalabilir; **eşdeğerlik ve GDK** `opId` üzerinden bağlanır. |

**Sabitler:** `edgeKind ∈ K` ([§9.3.1](#931-edgekind-closure-final)) — doğrusal profilde varsayılan **`causal`**. JSON alan sırası **canonical** (CSB normal form ile uyumlu).

### 9.5 Instruction → graph node mapping

**Yönergeler (tek iş parçacıklı G0→G3):**

| Kavram | Eşleme |
|--------|--------|
| **Instruction instance** | `Step` `k` = sıradaki `runGate(…, clockTick_k)` yürütmesi. |
| **Ön-düğüm** | `u_k = (clockTick_k, stateInHash_k)` — kenarın **kuyruğu**. |
| **Son-düğüm** | `v_k = (clockTick_{k+1}, stateOutHash_k)` — kenarın **başı**; `clockTick_{k+1} = clockTick_k + 1` (doğrusal profil). |
| **Yönlü kenar** | `e_k : u_k → v_k` etiketi `(opId_k, edgeKind_k)`. |

**Başlangıç:** Sanal düğüm `v_{-1} = (tick_init, H(inputs_norm))` politika ile; ilk adımın `stateInHash_0` buna **eşit** olmalı (aksi halde [§10.4](#104-hash-consistency-model)).

**Son durum:** Son adımın `stateOutHash` = kabul edilen **terminal** durum özeti.

### 9.6 OpId binding rules (canonical)

**Amaç:** Aynı **anayasal op** her zaman aynı `opId`’yi üretir; yüzey string’i (`impl`) tek başına kimlik **değildir**.

| Kural | İçerik |
|-------|--------|
| **O1 — Kapanır küme** | `opId`, `H_canon` girdisi yalnız şunlardan türetilir: `gdkPolicyVersion`, `manifestVersion` (veya `schemaHash`), `gateId`, **programdaki sabit sıra indeksi** (G0…G3 yuvası), `gateMap[gateId]` için **kanonik JSON** (veya `implHash`). |
| **O2 — Stabilite** | Aynı `(M, gdkPolicy, gateId)` → aynı `opId`; farklı yüzey biçimi aynı kanonik `gateMap` girdisine indirgendiyse **aynı** `opId`. |
| **O3 — Çakışma yasağı** | Farklı semantik op aynı `opId`’yi paylaşamaz; çakışma → manifest / politika hatası. |
| **O4 — GDK hizası** | `H_step` içinde kullanılan `opId`, bu kuralla **bit-bit** aynı olmalı ([`GDK-1` §5.1](GLOBAL_DETERMINISM_KERNEL_V1.md#51-tick-generation-function)). |

*Uygulama:* `opId` string veya `sha256:…` öneki; politika sürümü değişince `opId` **kasıtlı** değişir.

#### 9.6.1 OpId algebraic normal form (ANF)

**Konum:** EBVM artık “JSON üzerinde koşan VM” değil — **cebirsel VM**: yürütüm kimliği **runtime rastlantısı** değil, **kanonik tüp cebiri**nin indirgenmesidir. Aynı ANF → aynı **graf düğüm / op kimliği**; farklı JSON yüzey serileştirmesi **kimlik için irrelevant** (yalnız `μ` içine giren kanonik içerik önemli).

**ANF:** Her op, önce **yapısal tüp**e indirgenir; `opId` **yalnız** bu tüpün canonical serileştirmesinin hash’idir.

```text
ANF ::= ⟨ π, σ, ι, γ, μ ⟩

π  ::= gdkPolicyVersion          (string, politika kimliği)
σ  ::= schemaHash | manifestVersion  (EMCS sabitleri — politika hangisini zorunlu kılıyorsa)
ι  ::= slotIndex                 (0..n-1, program sırasındaki sabit yuva; G0→G3 için 0..3)
γ  ::= gateId                    (ör. "G0" … "G3")
μ  ::= canonicalJSON( gateMap[γ] )  (UTF-8 NFC, sorted keys; veya eşdeğer implHash)
```

**Normal form:**

`opId ::= H_canon( serializeTuple(ANF) )`

- `serializeTuple` — alan sırası **sabit** (π, σ, ι, γ, μ); ayırıcı ve encoding **GDK politika dokümanında** tek satır.  
- Aynı ANF → aynı `opId` (**cebirsel tutarlılık**); farklı yüzey `impl` aynı μ’ye indirgeniyorsa **aynı sınıf**.

**Reducer hizası:** [§7.2](#72-gecs-equivalence-reducer) `opId`’yi her zaman ANF üzerinden yeniden üretir; kayıtlı trace’teki `opId` ile çakışma → `CSB_ERR_VM_REPLAY_MISMATCH` veya `GDK_ERR_OPID_UNKNOWN`.

### 9.7 Edge generation rules

| Kural | İfade |
|-------|--------|
| **G1 — Tek causal zincir** | Her başarılı adım tam olarak **bir** outgoing **causal** kenar üretir; paralel causal kenar **yok** (referans EBVM). |
| **G2 — Sıra** | Kenarlar `clockTick` artan sırada üretilir; `k`-inci üretilen kenar `e_k`’dır. |
| **G3 — edgeKind ataması** | Doğrusal profilde tüm kenarlar `edgeKind = causal`. `semantic` / `structural`, audit için **ek etiket** veya ileride çok katmanlı graf profiline ayrılır (aynı fiziksel adımda çoklu anlam — **GECS** ile kanonikleştirilir). |
| **G4 — Durdurma** | `ok: false` adımında **terminal** düğüm = ön-düğüm; sonraki kenar **yok** (trace sonu). |
| **G5 — GDK reddi** | G1–G4 ihlali → trace **geçersiz**; runtime’da [`GDK-1` §11.4](GLOBAL_DETERMINISM_KERNEL_V1.md#114-graph-rejection-rules-summary). |

**Replay (v2):** `clockTick`, `opId`, `edgeKind`, hash alanları **strict** veya **GECS** sınıfına göre — [§10](#10-gecs-and-replayvmtrace-equivalence).

**Referans kod:** v1 [`evaluateBind.mjs`](../scripts/evaluateBind.mjs); **v2** = `vmVersion: EBVM-2.0` + bu grammar; uygulama **GDK bağımlılığı** ([`GDK-1` §10–11](GLOBAL_DETERMINISM_KERNEL_V1.md)).

---

## 10. GECS and replayVmTrace equivalence

**GECS (Graph Equivalence Class System):** İki trace’nin **aynı execution history sınıfında** olup olmadığını tanımlar; `replayVmTrace` ya **strict** (byte-for-byte alan eşitliği) ya da **canonical class** karşılaştırması yapar.

### 10.1 Strict replay reference (EBVM-1.0)

Referans uygulama: `replayVmTrace(manifest, inputs, recorded)` — [`evaluateBind.mjs`](../scripts/evaluateBind.mjs).

| Kontrol | Eşleme |
|---------|--------|
| Adım sayısı | `recorded.steps.length` = taze yürütüm |
| `manifestVersion` | İkisi de verilmişse string eşitliği |
| Her adım `i` | `gateId`, `ok`, `stateInHash`, `stateOutHash` **bire bir** |

Sapma → `CSB_ERR_VM_REPLAY_MISMATCH` + `detail` alanı. **impl / pc** strict sette **yok** (istersen politika ile genişletilir).

### 10.2 Graph isomorphism rules (equivalence class)

**Linear isomorphism (referans):** İki trace `T`, `T'` aynı uzunlukta ve adım `i` için:

- `clockTick_i` (v2) veya türetilmiş tick aynı,
- `opId_i` aynı (veya GECS normal formda aynı sınıf),
- `stateInHash_i`, `stateOutHash_i`, `ok_i` aynı.

**İzin verilen varyant (sınıf genişletmesi — planned):** Yalnız **etiketsiz** alanlar farklıysa (ör. `detail` metni, debug payload) ve politika `ignoreKeys[]` ile beyan edilmişse → aynı sınıf. **Hash veya opId** farkı → farklı sınıf.

**Yasak:** Farklı causal sıra veya farklı `stateOutHash` ile “eşdeğer” saymak (T1 ihlali).

### 10.3 Canonical ordering constraints

- Adımlar **`clockTick` artan** sırada listelenir; doğrusal profilde `clockTick_i = tick_init + i`.  
- **Yinelenen `clockTick` yok.**  
- `pc` varsa, aynı `clockTick` içinde **program sırası** ile uyumlu olmalı (`G0`→`G3`).  
- Karşılaştırma öncesi **canonical JSON** (anahtar sırası, NFC, LF) — [`GDK-1` §3](GLOBAL_DETERMINISM_KERNEL_V1.md#3-non-deterministic-input-sanitization).

### 10.4 Hash consistency model

| İlişki | Koşul |
|--------|--------|
| **Adımlar arası süreklilik** | `k ≥ 1` için `stateInHash_k === stateOutHash_{k-1}` (tek state hattı). |
| **headHash zinciri** | `headHash_{k+1} = H_step(headHash_k, clockTick_{k+1}, opId_k, stateNorm_k)` — GDK §5.1 ile aynı politika. |
| **Replay** | Ya **tüm adım hash’leri** strict eşleşir ya da **headHash_final** + GECS sınıfı (politika ile) eşleşir; ikisi karıştırılamaz. |

**Red:** Süreklilik veya `headHash` kırığı → `GDK_ERR_*` veya `CSB_ERR_VM_REPLAY_MISMATCH`.

---

## 11. Sonraki adımlar

Bunlar “isteğe bağlı roadmap” değil — **çekirdek bağımlılık zinciri** ([`GDK-1` §10](GLOBAL_DETERMINISM_KERNEL_V1.md)):

**A) EBVM-2.0 JSON Schema + referans kod** — `clockTick`, `opId`, `edgeKind`, `headHash` pipeline; `replayVmTrace` v2 + GECS modları.  

**B) GDK enforcement** — [`GDK-1` §11](GLOBAL_DETERMINISM_KERNEL_V1.md#11-gdk-enforcement-pipeline-runtime) ile tick validation, drift, graph rejection.  

**C) `evaluateBind` → trace canonicalizer** — JSON canonical form ([§7.1](#71-json-canonical-form-before-and-after-trace)), GECS reducer ([§7.2](#72-gecs-equivalence-reducer)), hash finalization ([§7.3](#73-hash-finalization-rule)); VM trace ile kapalı döngü.  

**D) EMCS upgrade algebra** — [`EMCS-1` §10.1–10.2](ENGINE_MANIFEST_CANONICAL_SCHEMA_V1.md).

### 11.1 Hard boundary (spec freeze)

**A) ANF reducer formal spec** — normalleştirme **completeness** (her geçerli op → tek ANF); **collision resistance** katmanı (`H_canon` varsayımı, pratikte SHA-256 ailesi + politika).  

**B) GDK clock injection safety (formal engineering)** — **tick injectivity** + **witness stability** ([`GDK-1` §5.4](GLOBAL_DETERMINISM_KERNEL_V1.md#54-single-writer-clock-theorem-engineering-form)); DCI / fork reddi matrisi dondurulur.  

**C) Trace canonicalization freeze** — **GECS** eşdeğerlik closure’unun nihai formu (`Π`, `ignoreKeys`, class vs strict); JSON Schema + CI golden vectors.

**D) MK-1 reference implementation** — [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) (`mk1Validate`, streaming MK-1.1 / execution firewall ile genişleme).

---

## 12. Mutation policy

EBVM-1 **append-only**; **ISA v2** anlam kırıcı genişleme → `EBVM-2.0` veya bu belgede yeni üst bölüm; v1 trace’ler **lossy** yükseltilebilir (tick türetme kuralı ile).

---

*EBVM-1 — DETAM trace generator: §7 üç fazlı canonicalizer; §9 ISA v2 minimal primitives + K closure + ANF; §10 GECS; no reasoning injection.*
