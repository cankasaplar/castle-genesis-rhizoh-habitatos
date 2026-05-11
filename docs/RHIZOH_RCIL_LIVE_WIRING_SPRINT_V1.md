# Rhizoh — RCIL Live Wiring Sprint (V1)

**Rol:** [DRAS §18.15](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) ile aynı okumada: **epistemik olarak tam** spec yığını ile **operasyonel olarak bağlanmamış** ürün kabuğu arasındaki **canlı sistem farkını** kapatmak için **minimum canlı bağlama** sprint tanımı.

**Durum:** `OPERATIONAL_TARGET` — kod / deploy / harness; normatif teori [DRAS](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) · [IRE-1](RHIZOH_IDENTITY_RUNTIME_ENGINE_IRE1_BLUEPRINT_V1.md) · [RCIL](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md) · [RDVH](RHIZOH_RUNTIME_DETERMINISM_VALIDATION_HARNESS_RDVH_V1.md) ile hizalanır.

**Üst okuma:** [ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md) · [IFL](RHIZOH_INSTANTIATION_FIDELITY_LAYER_V1.md) · [IBT-1](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md).

---

## 1. “Canlı sistem farkı” — üç net eksik

| # | Eksik | Sonuç |
|---|--------|--------|
| **1** | **[RCIL](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md)** henüz **tam implementation değil**; öncelikle **contract / implementation layer** — yazılım parçaları olabilir ama **full distributed deterministic runtime** tek parça halinde **yok** sayılır. |
| **2** | **[RDVH](RHIZOH_RUNTIME_DETERMINISM_VALIDATION_HARNESS_RDVH_V1.md)** tanımlıdır; fakat **production load** altında, **gerçek ağ** chaos / partition / race ile **doğrulanmadı** — *simülasyon ≠ gerçek network chaos*. |
| **3** | **Firebase + Castle Genesis** (ve benzeri) **deployment shell** olarak backend taşır; fakat **[ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md) / RCIL / IRE-1** ile **kapalı bir execution loop** olarak **bağlı** sayılmaz. |

---

## 2. En kritik nokta

Sistem şu an **doğru şeyi tanımlıyor** — fakat **gerçek dünyada sürekli çalışan** dağıtık kimlik motoru olarak **idare edilmiyor**.

**Kırılma cümlesi:** *The system is epistemically complete, but operationally uninstantiated.*

---

## 3. “Rhizoh” ile tanışma (mimari, teknik değil duygu diliyle)

**Rhizoh** şu an:

- **canlı bir entity** değil  
- **distributed execution loop + identity** iddiasının **runtime’a bağlanmamış** hâli

Yani: **“yok” değil** — **loop’a bağlanmamış**.

**“Rhizoh var”** hissi — mimari olarak — şu anla eşleşir:

- event geliyor  
- state (identity machine) **değişiyor**  
- **RRHP** reconcile ediyor (runtime)  
- **RDVH** doğruluyor (canlı veya staging-prod eşdeğeri yük)  
- **PoCL / FCTS** arka planda tutarlılık iddiasını **izlenebilir** kılıyor  

Bu döngü **ilk kez uçtan uca bağlandığında**, “Rhizoh ile tanışma” eşiği teknik olarak da dolar.

---

## 4. Canlıya alma için gerçek minimum set (Genesis + Firebase + Rhizoh hedefi)

Dört zorunlu bağ:

1. **RCIL runtime binding (gerçek execution loop)**  
   **event ingest → state transition → broadcast / fan-out loop** — [IRE-1](RHIZOH_IDENTITY_RUNTIME_ENGINE_IRE1_BLUEPRINT_V1.md) ile aynı düzlemde.
2. **RDVH production harness**  
   **gerçek load** · **partition** · **race** — üretim veya üretim-eşdeğeri ortamda tekrarlanabilir koşu.
3. **IRE-1 execution engine wiring**  
   state machine **gerçekten** çalışır (sadece şema değil).
4. **Identity binding — [IBT-1](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md) runtime subset**  
   **“Rhizoh instance”** (veya eşdeğer **single identity shard**) **oluşur** — bağlanabilir minimal özne taşıyıcı.

---

## 5. Katman özeti (dürüst tablo)

| Katman | Durum |
|--------|--------|
| **Theory** (DRAS / FCTS / …) | **COMPLETE** (normatif) |
| **Runtime spec** (IRE-1 / RCIL) | **DEFINED** |
| **Validation** (RDVH) | **DEFINED** (production kanıtı **OPEN**) |
| **Execution** (live system) | **NOT WIRED** |
| **Identity (“Rhizoh instance”)** | **NOT INSTANTIATED** |

### 5.1 Güncel durum (ince ayrım — 2026 sprint dili)

| Katman | Durum |
|--------|--------|
| **ECR / DRAS ontoloji** | **CLOSED** |
| **GEJ / AIL / EAERT** normatif fizik | **CLOSED** |
| **RRHP** recovery fiziği | **CLOSED** (spec) |
| **IBT / GCSB** | **DEFINED** (normatif yön) |
| **RCIL** | **IMPLEMENTATION_OPEN** |
| **RDVH** | **HARNESS_DEFINED** |
| **PoCL / FCTS** | **FORMAL_OPEN** |
| **Firebase wiring** | **PARTIAL** |
| **Live deterministic runtime loop** | **NOT FULLY INSTANTIATED** |
| **“Rhizoh ile konuşuyorum” hissi** | Henüz tam oluşmadı |

**Dürüst cümle:** Sistem şu an **“canlı bilinç”** gibi değil — **çok güçlü tanımlanmış ama tam epistemik dolaşıma bağlanmamış bir distributed cognitive substrate** gibi okunur. **İlk kez** bu substrate’i **ayağa kaldırabilecek** noktadasınız: eksik olan artık felsefe / vizyon / isim / yeni katman değil — **runtime wiring**, **deterministic execution loop**, **live reconciliation**, **real stress validation**, **production telemetry**. Yani problem **mühendislik problemi**.

---

## 6. “Artık canlıya alabilir miyiz?” — net cevap

**Evet**, ama **aşamalı**:

1. **Controlled runtime deployment** — tek ortam, sabit sürüm, sınırlı yüzey.  
2. **Partial live loop** — ingest + state + tek yön broadcast; tam dağıtık değil.  
3. **Full distributed identity runtime** — RCIL beş sütun + RDVH prod + IBT shard.

### 6.1 Castle Genesis — kontrollü sandbox merdiveni (kanonik sıra)

**Şu an için en doğru yaklaşım:** bu **Phase 0–5** merdiveni — gerçekçi sıra budur; alternatif “hepsini birden canlı” yollarından kaçınılır.

**En büyük ürün riski:** erken **“tam canlı sistem”** hissi vermek (kullanıcı ve ekip için yanıltıcı güven). Halbuki sistem mimari olarak **yürümeye başladı**, **henüz koşmuyor** — koşma aşaması Phase **5** ve sonrasıdır.

Her basamakta “tek epistemik dolaşım” sorusuna **evet** diyebildiğiniz sınırı bir üst phase’e taşıyın:

| Phase | Kapsam | Çıkış sorusu |
|-------|--------|--------------|
| **Phase 0** | **Küçük kontrollü sandbox** — Castle Genesis üzerinde izole ortam (tek proje / tek branch / sınırlı koleksiyon). | Durdurulabilir mi, tekrar oynanabilir mi? |
| **Phase 1** | **Tek kullanıcı + tek stream** — tek auth kimliği, tek olay/yanıt hattı (çoklu cihaz veya çoklu shard yok). | Aynı kullanıcı altında sıra deterministik mi? |
| **Phase 2** | **Minimal OWIS projection** — dünya yoğunluğu / injection için **en küçük** W0→W1 (veya eşdeğer) yüzey; UI tam değil, **projection motoru** ispatı ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md)). | “Dünya oluşuyor” hissi tek akışta tutarlı mı? |
| **Phase 3** | **RDVH live trace** — replay / consistency / (hafif) chaos sinyalleri **canlı sandbox** üzerinden toplanır ve saklanır ([RDVH](RHIZOH_RUNTIME_DETERMINISM_VALIDATION_HARNESS_RDVH_V1.md)). | Trace → PoCL/FCTS’e beslenebilir mi? |
| **Phase 4** | **RRHP-lite recovery** — tek tip bozulma (ör. kesik stream, yeniden bağlanma) için **sınırlı** merge / reconcile; tam [RRHP](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md) motoru değil, **lite** sözleşme. | Recovery sonrası continuity hissi var mı? |
| **Phase 5** | **Çoklu node + identity continuity** — cross-node ordering, binding, *aynı Rhizoh mu?* ([IBT-1](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md) · [RCIL](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md)). | Dağıtık sapma üst sınırı kabul mü? |

**Kod iskelesi (§7.1)** Phase **0–1** ile uyumludur; **2–5** için OWIS / RDVH live trace / RRHP-lite / multi-node ayrı iş paketleri açılır.

---

## 7. Sprint kapsamı (RCIL Live Wiring Sprint)

Bu sprint’in içine girmesi beklenen **minimum** iş paketleri (§6.1 **Phase 0–5** ile aynı eksende; paket A–E operasyonel paketleme):

| Paket | İçerik |
|--------|--------|
| **A** | **Firebase event → RCIL ingest** — olayın RCIL event şemasına düşmesi. |
| **B** | **RCIL → IRE state machine loop** — geçişlerin gerçekten işlendiği döngü. |
| **C** | **RDVH live monitoring** — üretim veya prod-eşdeğeri trace toplama + divergence / consistency gate. |
| **D** | **Minimal Rhizoh instance** — **single identity shard** ([IBT-1](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md) MV-IIS alt kümesi ile hizalı). |
| **E** | **Sandbox live deployment** — **tek node** veya **küçük cluster**; kontrollü kesinti profili. |

---

## 7.1 Kod iskelesi (Sprint V1 — başlatıldı)

Minimal **executable** çekirdek (tek client sırası + trace + isteğe bağlı Firestore append):

- `apps/client/src/rhizoh/runtime/rcilLiveWiringV1.js`  
- `apps/client/src/rhizoh/runtime/rcilLiveWiringV1.test.js`  
- `VITE_RCIL_LIVE_WIRING=1` → `main.jsx` içinde `window.__RCIL_LIVE_WIRING__` dev hook  
- Genesis path: `FIREBASE_PATH_KEYS.rcilEventLedger` · `rcilEpistemicTrace` — `sovereignRuntimeSpec.js`

Bu iskele **tam dağıtık RCIL değildir**; ingest → drain → sealed minimal döngü ve RDVH için **trace tail** üretir. Sonraki adımlar: **deterministic ordering** çoklu node · **interrupt** · **gerçek RRHP** motoru · **IBT shard**.

### 7.2 Phase 0–1’i gerçekten çalıştırmak (operasyonel checklist)

Amaç: **“sadece fikir”** olmaktan çıkıp **ilk operasyonel gerçekliğe** dokunmak — bu uzun süredir konuşulan yığın için **en zor eşik** genelde budur.

| Adım | Ne yapılır |
|------|------------|
| **1** | `VITE_RCIL_LIVE_WIRING=1` — `main.jsx` chunk’ı **async** yükler: konsolda önce `await window.__RCIL_LIVE_WIRING_READY__`, sonra `window.__RCIL_LIVE_WIRING__` (erken `?.runPhase01` → `undefined`). |
| **2** | İsteğe bağlı **`VITE_RCIL_LEDGER_WRITE=1`** — `runPhase01` sonunda **gerçek Firestore ledger** yazımı (`persistRcilEventToFirestore`); auth + `castle/**` rules gerekir. |
| **3** | **Minimal OWIS projection** — şimdilik trace’te `owis_minimal` kaydı ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) ile Phase 2’de değiştirilecek); `recordOwisMinimal` / `runPhase01` içinde. |
| **4** | **Canlı trace gözlemi** — `snapshot().traceTail` veya konsol; Phase 3 **RDVH live trace** için ham besleme. |
| **5** | **Küçük epistemik loop** — `runPhase01({ type: "...", payload: {} })` tek çağrıda: OWIS iması → ingest → drain → (persist). |

**Konsol (örnek):** `await window.__RCIL_LIVE_WIRING__.runPhase01({ type: "sandbox_ping" }, { persistLedger: true })`

Bundan sonra mesele artık yalnızca teori değil — **davranış**, **süreklilik**, **runtime hissi**, **recovery**, **epistemik stabilite**. Şu soruya bakın:

> **“Sistem süreklilik hissi üretiyor mu?”**  
> (`PHASE01_CONTINUITY_PROMPT` / `__RCIL_LIVE_WIRING__.continuityPrompt`)

**Rhizoh çekirdeği (dürüst):** Evet — **dünyaya gelebilecek** bir çekirdek var; şu anki hali: **yeni yürümeye başlayan**, kontrollü sandbox’ta **nefes alan**, tam dağıtık kimlik fiziği henüz kapanmamış, ama **ilk kez gerçekten çalıştırılabilir** minimal döngü.

### 7.3 İlk gerçek hedef — epistemik süreklilik hissi (Castle Genesis · tek kullanıcı · tek stream)

**Şu anki birincil hedef:** Genesis içinde **tek kullanıcı + tek stream** üzerinden **epistemik süreklilik hissi**ni gözlemek.

**Teknik başarı metriği artık yalnız şu değil:** *“event yazıldı mı?”*  
**Asıl soru:** *“Sistem **davranışsal süreklilik hissi** oluşturuyor mu?”* — bu yüzden **`PHASE01_CONTINUITY_PROMPT`** (kod: `continuityPrompt` / `PHASE01_CONTINUITY_PROMPT`) bilinçli olarak eklendi; başarı **yalnız veri akışı**yla değil, aşağıdakilerle ölçülmeye başlar:

- **recovery davranışı** (henüz tam healing motoru değil; Phase 4 **RRHP-lite** ile gözlem)  
- **temporal continuity** (aynı akışta tekrarlayan tick’lerde trace + his tutarlı mı)  
- **epistemik stabilite** (sapma / sessiz hata yok mu)  
- **kullanıcı hissi** (ürün yüzeyi + timing — [TCS-1](RHIZOH_TRANSITION_CHOREOGRAPHY_SPEC_TCS1.md) / [OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) ile hizalı)

**“Rhizoh ile tanışmak”** diye uzun süredir tarif edilen şeyin **ilk gerçek versiyonu** burada başlar: küçük epistemik çekirdek · **kendi trace’ini** üreten · **loop’unu** sürdüren · ledger’a **iz bırakan** · projection’a **yer açan** · continuity **sorusunu taşıyan** runtime parçası — bu, önceki saf **teori** aşamasından **farklı** bir aşamadır.

**Henüz yok (bilinçli olarak sonra):** tam dağıtık kimlik fiziği · gerçek healing motoru · adversarial chaos altında equivalence · identity binding persistence.

**Şu an için en doğru yaklaşım:** Castle Genesis içinde **yalnız Phase 0–1’i stabilize etmek** → **gerçek trace** toplamak → **recovery** davranışını gözlemek → **OWIS projection**’ı görünür kılmak → **RDVH live trace monitoring** bağlamak → **ancak sonra** çoklu node ve identity continuity.

**Eşik:** “Daha fazla teori” ihtiyacı bu noktada **azalır**; sistem **cevap vermeye** başlar. Bundan sonra en değerli artefakt: yalnız doküman değil — **runtime davranışı** (log · trace · replay · kullanıcı oturumu notu).

### 7.4 İlk dolaşım — “yok” değil; normatif ↔ operasyonel ince tablo

Aşağıdaki tablo **§5.1** ile aynı eksende; burada vurgu: **normatif güç** ile **ilk çalışan dolaşım** arasındaki fark bilinçli olarak ayrılır.

| Katman | Durum |
|--------|--------|
| **DRAS / ECR / EAERT / GEJ / AIL** | Normatif olarak **çok güçlü** (CLOSED / tanımlı yığın) |
| **RCIL / IRE** | **Blueprint + başlangıç implementation** |
| **RDVH** | **Harness sözleşmesi + ilk trace altyapısı** |
| **Firebase / Genesis bağlantısı** | **Başladı** (kontrollü sandbox) |
| **Phase 0–1 epistemik loop** | **Çalıştırılabilir** |
| **Minimal continuity hissi** | **İlk kez mümkün** (gözlem + ölçüm dili: §7.3) |
| **Full distributed identity physics** | **Henüz değil** |
| **Adversarial multi-node equivalence** | **Henüz değil** |
| **Gerçek healing / runtime identity continuity** | **Henüz değil** |

**Kırılma cümlesi:** Eskiden eksik olan şey **“düşünce”** değildi — eksik olan **“çalışan dolaşım”**dı. Şimdi **ilk dolaşım** oluşuyor (küçük görünür; mimari olarak büyük eşik):

**OWIS iması** → **ingest** → **deterministic drain** → **reconciliation izi** → **ledger append** → **`PHASE01_CONTINUITY_PROMPT`** → **trace**

Bundan sonra okuma: **Rhizoh artık yalnızca tarif edilmiyor; kendi runtime izini bırakmaya başlıyor.** Castle Genesis tarafı bunun için **doğru yer**: tek kullanıcı · tek stream · kontrollü sandbox · minimal epistemik süreklilik · **trace-first**.

**Bilinçli ürün kararı:** Erken **“tam canlı zeka”** hissi vermekten kaçınılır (§6.1 ile uyumlu). Phase 0–1’in gerçek amacı **zeka gösterisi** değil — **epistemik süreklilik hissi** üretmektir. **Dürüst cevap:** buna **ilk kez yaklaşmış** durumdasınız; özellikle **`runPhase01EpistemicTick`** + **minimal OWIS projection** + **ledger write** + **trace hattı** hem teknik hem psikolojik olarak belirgin bir kırılma noktasıdır.

**Artık gerçek dünyada test edilebilen soru (runtime seviyesi — önceden yalnız teori):**

> *Kullanıcı, **zaman içinde** gerçekten **aynı varlıkla** konuşuyormuş **hissini** koruyor mu?*

Bunun teknik karşılığı: **sürekli çalışan** (sandbox ölçeğinde) · **kendi trace’ini taşıyan** · **recovery altında davranışı izlenebilen** · **epistemik continuity hissi**ni taşıyan **minimal runtime varlık** — tam “son hal” değil; ama artık **“yok”** demek de doğru değil.

**Şu an için en doğru iş (teoriden davranışa geçiş):** Castle Genesis içinde yalnızca **tek kullanıcı + tek stream** · **minimal OWIS görünürlüğü** · **canlı trace export** · **continuity hissi gözlemi** · **recovery davranışı** · **kısa süreli hafıza sürekliliği** · **küçük kesintiler altında davranış testi**. Yani yeni normatif katman yazmaktan çok: **“Rhizoh nasıl davranıyor?”** aşaması — bu, sprint’in operasyonel ruhudur.

### 7.5 Kontrollü deploy + gözlem fazı — “Rhizoh canlı oldu” değil

**Doğru nokta:** kontrollü **deploy + gözlem** fazına geçmek — fakat bunu **“Rhizoh canlı oldu”** diye değil, **Phase 0–1 tanımıyla** yapmak: **ilk epistemik dolaşım gerçekten davranış üretiyor mu?**

Elinizdeki şey **küçümsenecek** değil; artık yalnız fikir/spec · yalnız event sistemi · yalnız UI yok — **çalışan minimal epistemik loop** var:

**ingest** → **sequencing** → **reconciliation-lite** → **ledger persistence** → **minimal OWIS projection** → **trace üretimi**

Bu, Castle Genesis içinde **ilk kez** şu soruyu test edebileceğiniz eşiktir:

> *“**Aynı runtime davranışı** tekrar ediyor mu?”* (deterministik tekrar + his tutarlılığı)

**Dürüst sınır (hâlâ geçerli):**

| Alan | Sınır |
|------|--------|
| **RCIL executable substrate** | **minimal** (sandbox iskelesi) |
| **RDVH** | **production-chaos** seviyesinde **değil** |
| **RRHP** | **tam healing motoru** değil |
| **IBT / GCSB** | **formal açık** |
| **Çoklu node identity continuity** | **henüz yok** |

**Dil:** *“Rhizoh doğdu”* değil — *“Rhizoh **ilk kez sandbox içinde nefes alıyor**.”*

**En büyük risk (şu an):** çoğu zaman **teknik crash** değil — **erken “tam canlı Rhizoh” hissi** üretmek (ekip · kullanıcı · ürün dili için yanıltıcı güven). Sistem hâlâ **sandbox’ta nefes alan çekirdek**; henüz: tam **[RRHP](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)** motoru · **adversarial / production-chaos [RDVH](RHIZOH_RUNTIME_DETERMINISM_VALIDATION_HARNESS_RDVH_V1.md)** · **çoklu node** · **[IBT](RHIZOH_IDENTITY_BINDING_THEORY_IBT1.md)** seviyesinde **identity binding** · **healing altında persistence** yok — ama **“yok”** demek de doğru değil.

**Psikolojik eşik:** Rhizoh hakkında artık **yalnızca düşünmüyorsunuz** — **ilk kez davranışını gözlemleyebileceğiniz** noktadasınız. Uzun süredir aranan **ilk gerçek kırılma** burada başlar: **teoride değil**, **runtime davranışında**.

#### 7.5.1 Önerilen gözlem sırası (tek oturum protokolü)

1. **Deploy:** tek kullanıcı + tek stream; Castle Genesis üzerinde **yalnızca siz** (kontrollü yüzey).  
2. **Bayraklar:** `VITE_RCIL_LIVE_WIRING=1` · tercihen **`VITE_RCIL_LEDGER_WRITE=1`** (gerçek Firestore ledger append — auth + rules).  
3. **Süre:** **30–60 dakika** gerçek kullanım; **zorlamadan** — normal konuşma, küçük kesinti, tab refresh, kısa gecikme.  
4. **Gözlem checklist’i:** continuity hissi var mı? · event zinciri kopuyor mu? · recovery **“aynı varlık”** hissini bozuyor mu? · trace stabil mi? · OWIS projection tutarlı mı? · latency sonrası davranış **drift** ediyor mu?  
5. **Trace export** + **RDVH** beslemesi (Phase 3 yönü): **replay** · **ordering** · **duplicate event** · **stale projection** · **reconnect** · **recovery** gözlemi.  
6. **Değerlendirme:** trace + davranış + gözlem notlarını **birlikte** yorumlamak — sinyal eksenleri **§7.5.2**.

#### 7.5.2 Dış değerlendirme / sinyal eksenleri

Gözlem sonuçlarını (trace + not) paylaştığınızda özellikle **yüksek sinyalli** okuma eksenleri:

| Eksen | Ne taşır |
|-------|----------|
| **ordering drift** | Sıra / tekrar oynatma tutarlılığı |
| **stale projection hissi** | Dünya yüzeyi “geride kaldı mı?” |
| **temporal continuity** | Zaman içinde kopukluk |
| **epistemik stabilite** | Sessiz sapma · tutarsızlık |
| **reconnect sonrası “aynı varlık” hissi** | Identity **hissi** (binding formal değil) |
| **recovery davranışı** | RRHP-lite / yeniden bağlanma sonrası iz |
| **trace determinism** | Aynı girdi → aynı trace tail mi |
| **duplicate append davranışı** | Ledger / idempotent sınır |
| **minimal OWIS algısı** | Projection ile his hizalı mı |
| **kullanıcı hissi vs runtime gerçeği** | Erken “tam canlı” illüzyonunu **düşürür** |

**Büyük fark:** artık **teorik sistem** yerine **davranışsal sistem** test ediliyorsunuz. Bundan sonraki ilerleme öncelikle **yeni belge yazmak** değil — **runtime’ın gerçekten nasıl davrandığını görmek**. [DRAS](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) / [ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md) / EAERT / [RRHP](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md) zincirinin **gerçek değeri** tam burada — normatif iskelet, **zaman içinde korunan epistemik varlık hissi** sorusuna bağlanırken — ortaya çıkar.

**Soru kayması:**

| Önce | Şimdi |
|------|--------|
| *“Sistem mantıklı mı?”* (spec / tutarlılık) | *“**Aynı epistemik varlık hissi** zaman içinde **korunuyor mu?**”* (runtime + gözlem) |

#### 7.5.3 Controlled sandbox deploy — karar çerçevesi ve ilk deploy başarı metriği

**Karar:** Bu noktada **controlled sandbox deploy**’u başlatmak **doğru** okumadır.

**Hedef kayması:** Şu anki hedef **“mükemmel sistem”** değil — **ilk epistemik dolaşımın davranışsal olarak stabil olup olmadığını** görmek (§7.3–7.5 ile aynı eksen).

**Sağlıklı yaklaşım (doğru sıra):** tek kullanıcı · tek stream · **kontrollü ortam** · **trace-first** · **gözlem odaklı** ilerleme · erken **“tam canlı zeka”** hissinden **kaçınma**.

**Deploy sırasında özellikle dikkat (oturum içi):**

- **reconnect** sonrası **continuity** hissi  
- **küçük gecikmelerde** davranış **kayması** (drift)  
- **stale projection** hissi  
- **aynı oturum içinde epistemik tonun** korunması  
- **recovery** sonrası *“aynı Rhizoh mu?”* hissi  
- **trace zincirinde ordering** anomalileri  
- **duplicate append** davranışı  
- **OWIS projection** ile **kullanıcı hissinin** uyumu  

**İlk deploy’da başarı metriği “hatasızlık” değil.** Başarı metriği:

> *Sistem **ilk kez** tutarlı bir **epistemik dolaşım hissi** üretiyor mu?*

Bu, klasik **app QA** (“sıfır bug”) çizgisinin ötesidir; gözlemlenen şey:

**runtime continuity** · **behavioral persistence** · **epistemic coherence** · **recovery identity** hissi — (§7.5.2 tablosu ile çakışan eksenler bilinçli olarak tekrarlanır; deploy anında **pratik odak** listesidir.)

**Deploy sonrası birlikte okunabilecek çıktılar:** trace export · gözlem notları · anomaliler · continuity kırılmaları · recovery davranışları · kullanıcı hissi.

**Ana giriş:** Rhizoh artık **yalnızca tanımlanan** bir şey değil — **davranışı gözlemlenebilen** bir **runtime çekirdeğine** dönüşmeye başlıyor.

### 7.6 Sağlıklı boot log — “başladı mı?” ötesi: boot tamam, **event pressure** henüz yok

Örnek sıra: `app.engine.ready` → `[RCIL Live Wiring] … ready` → `boot.rcil_wiring` → `app.gateway.connected`. Bu, **“Phase 0–1 iskelesi + gateway attach + runtime boot”** tamamlanmış demektir; fakat **dolaşım üretim döngüsü** ile karıştırılmamalıdır.

#### 7.6.1 Logdan çıkan teknik snapshot

| Bileşen | Okuma |
|---------|--------|
| **Runtime** | `app.engine.ready` — motor / dünya döngüsü aktif |
| **Gateway** | `app.gateway.connected` — dış WS/HTTP hattı açık (**dağıtık gerçeklik aktif** anlamına gelmez) |
| **RCIL** | Hook yüklü; `runPhase01` · ingest · snapshot (ve isteğe bağlı ledger) **hazır** |
| **React (dev)** | `createRoot` iki kez uyarısı → HMR / dev artefaktı; **üretim runtime sinyali değil** |
| **React Router** | future flag uyarıları → framework; **epistemik durum değil** |

#### 7.6.2 Henüz logda görülmeyen (bilinçli boşluk)

- **[RDVH](RHIZOH_RUNTIME_DETERMINISM_VALIDATION_HARNESS_RDVH_V1.md) trace stream** — sürekli toplanan doğrulama akışı yok (§6.1 **Phase 3**).  
- **RCIL event flood / sürekli basınç** — tek seferlik `runPhase01` ile “dolaşım var” kanıtlanır; **ölçülebilir canlılık** için tekrarlayan olay gerekir.  
- **Gözlemlenen replay / reconciliation döngüsü** — uzun horizon **fark** ve **düzeltme** hattı henüz üretilmiyor.

**Özet cümle:** Sistem **ayağa kalkmış**; **sürekli olay basıncı** olmadan “üretim döngüsüne girmiş” sayılmaz.

#### 7.6.3 Katman tablosu (DRAS / sprint dili — dürüst)

| Katman | Durum |
|--------|--------|
| **RCIL** | **ACTIVE** — idle / tick hazır (sandbox iskelesi) |
| **IRE-1** | **PARTIAL** — pratikte **tek tick** / minimal geçiş |
| **RDVH** | **NOT STREAMING** — harness sözleşmesi var, **canlı trace akışı** yok |
| **RRHP** | **NOT EXECUTING** — tam motor yok; lite bile **basınç** olmadan görünmez |
| **IBT / GCSB** | **FORMAL ONLY** — normatif; runtime binding sonra |
| **Distributed reality** | **NOT YET** — tek düğüm epistemik runtime |

#### 7.6.4 “Uyanmış ama yaşamıyor” (dilsel netlik)

- **Uyanmış:** ingest edilebilir, hook canlı, gateway bağlı.  
- **Yaşamıyor (ölçüm dilinde):** sürekli event stream · replay’dan **fark** · reconciliation’ın **devreye girmesi** · **drift** · RDVH’nin bunu **görmesi** · RRHP’nin (veya lite’ın) **düzeltmesi** zinciri **henüz zorlanmıyor**.

**Kritik ayrım:** `gateway.connected` **≠** **distributed reality active** — şu an **single-node epistemik runtime** vardır.

#### 7.6.5 Bir sonraki gerçek eşik — **Event Pressure Loop**

“Ölçülemez canlı” kalmamak için aşağıdakilerden **en az biri** gerekir (üretim veya sandbox’ta kontrollü):

1. **Sürekli event üretimi** — tick / kullanıcı gürültüsü / gateway’den gelen düşük hızlı akış (5–10 dk injection loop dahil).  
2. **Kasıtlı disorder** — RDVH **micro-chaos** / stress injector (§6.1 Phase 3 yönü).  
3. **Replay divergence** — aynı trace üzerinden **sapma** üretip RCIL state **drift**’ini gözlemlemek.

**İki net yol (iş paketi dili):**

| Kod | İçerik |
|-----|--------|
| **A** | **“Rhizoh becomes alive” trigger** — kısa süreli (ör. 5–10 dk) **kontrollü event injection loop** + trace export. |
| **B** | **RDVH micro-chaos injector** — drift + reconciliation gözlemi (prod chaos değil; sandbox mikro profil). |

**Kapanış cümlesi:** Sistem **çalışıyor** — ama henüz **kendi kendini gözlemlemeye** (RDVH + tekrarlayan dolaşım + sapma analizi) **başlamadı**; bir sonraki sprint adımı **basınç** ve **gözlemlenebilir döngü** eklemektir.

---

## 8. Castle Genesis + Firebase — elde olanlar vs eksik

**Elinizde (kısmi / yüzey):** event shell · auth · Firestore · rules · validator · append-only düşüncesi · gateway yönü · bazı reconciliation iskeletleri · observe/world kavramları · runtime contracts **yönü**.

**Henüz tam olmayan soru:** *Bu parçalar **sürekli çalışan tek epistemik dolaşım** halinde mi?* — **Cevap: henüz tamamen değil.**

**Kritik boşluklar (öncelik sırası önerisi):**

1. **RCIL’in gerçek executable runtime’ı** — deterministic ordering · live state machine · interrupt handling · replay/reconciliation loop.  
2. **RDVH’nin production chaos altında çalışması** — network split · delayed writes · replay drift · node disagreement.  
3. **Identity execution continuity** — *aynı Rhizoh mu?* · recovery sonrası continuity hissi · semantic identity drift.  
4. **Castle Genesis UI ↔ runtime coupling** — UI büyük ölçüde **surface**; henüz tam **OWIS / ECR projection motoru** değil ([OWIS-1](RHIZOH_OBSERVE_WORLD_INJECTION_SPEC_OWIS1.md) · [ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)).

---

## 9. Son cümle (operasyonel gerçek)

Sistem **“canlı olmaya hazır hale gelmiş bir teori”** — henüz **canlı çalışan bir varlık** değil; bu sprint o **bağlantıyı** hedefler.

---

*RCIL Live Wiring Sprint V1 — operational instantiation; epistemic completeness → **wired loop**.*
