# RHIZOH “Proof Operating System” — yol haritası

**Dağıtık Epistemik Yürütme ve Kanıt Orkestrasyonu Çalışma Zamanı (DEEPOR)** vizyonu: Rhizoh’u salt simülasyon motoru olmaktan çıkarıp, **ne hesaplandığını**, **neyin gözlendiğini** ve **hangi yükümlülüklerin kanıtlanması gerektiğini** aynı çatı altında birleştiren, ağır SMT’yi *içeride tek monolit* yerine **dış kanıt ağı ve politika kapıları** ile orkestre eden bir çalışma zamanı haline getirmek.

Bu belge **hedef mimariyi** ve **fazlı teslimatı** tanımlar. Mevcut kod tabanındaki dürüstlük çizgisi korunur: bugün çoğu kanıt yüzeyi **iskelet / politika / telemetri** düzeyindedir; aşağıdaki fazlar, bunları **endüstriyel sertleştirmeye** taşıyan yol haritasıdır. Ayrıntılı modül listesi: [`RHIZOH_KERNEL_VNEXT529.md`](RHIZOH_KERNEL_VNEXT529.md).

---

## 1. Ontolojik üçlü: Hesaplama · İz · Kanıt uzayı

| Boyut | Soru | Çalışma zamanı rolü | Bugün (özet) | Hedef |
|--------|------|---------------------|--------------|--------|
| **Hesaplama** | Ne oldu? | WGSL/CPU yürütme, karar modları, boids / hücre / komşuluk | `rhizohGpuShadowPath.js`, WGSL pasları | Aynı; sürümlenmiş **yürütme sözleşmesi** (schema hash) ile mühürlenmiş girişler |
| **İz** | Ne gözlendi? | Frame mührü, replay zinciri, GPU fingerprint, adli ön kontroller | `rhizohReplaySeal.js` (FNV tabanlı zincir), joint seal, registry bayrakları | **Tam deterministik replay** için semantik olay günlüğü + kriptografik bağlayıcı |
| **Kanıt uzayı** | Ne kanıtlanmalı? | Yükümlülük kimlikleri, SMT IR, dış sertifika zarfı | `buildEpistemicSmtIrV1`, External Truth Protocol, Proof Network v1 | Gerçek **SMT çağrısı**, **kanıt derleme** çıktısı, **doğrulama çekirdeği** ile kapatılan döngü |

Bu ayrım, otonom sistemlerde aranan “güven mimarisi” ile uyumludur: çekirdek **ispat üretmek zorunda değil**, fakat **kanıtı nereye yönlendireceğini**, **nasıl toplayacağını** ve **hangi politika ile uygulayacağını** bilmek zorundadır (*orchestration-first*, *verification-aware*).

---

## 2. Mevcut envanter (vNext-529)

- **Egemen / politika çalışma zamanı**: `rhizohRuntimeGuarantees.js`, `evaluateRhizohPreApplyGate`, `PRODUCTION_BLOCKING` söylemi.
- **Kanonik eşdeğerlik (Pass45)**: `rhizohCanonicalEquivalence.js`, `rhizohGpuDecisionFinalize.js`.
- **Replay seal v1**: `rhizohReplaySeal.js` — zincirleme özet; `verifyReplaySealChainIntegrity` yapısal ön kontrol.
- **Solver dışsallaştırma**: `rhizohSolverExternalizationLayerV1.js` — tekil plugin, stub doğrulayıcı.
- **Dış kanıt ağı**: `rhizohExternalProofNetworkV1.js` — çoklu düğüm, güven ağırlığı, yönlendirme grafiği.
- **Dış truth protokolü**: `rhizohExternalTruthCertProtocolV1.js` — istek/yanıt sözleşmesi.
- **Tek köprü yükü**: `buildFormalClosureBridgePayload` — epistemik + evrim + solver + ağ özetleri.

---

## 3. Hedef mimari bileşenleri

### 3.1 Gerçek SMT entegrasyon mimarisi

**İlke:** SMT, gerçek zamanlı kare döngüsünün içinde bloklayıcı monolit değil; **yan süreç / worker / ağ düğümü** (Sovereign Verification hattı, yol haritası Faz 5 ile uyumlu).

| Katman | Açıklama |
|--------|-----------|
| **IR sözleşmesi** | `buildEpistemicSmtIrV1` çıktısının şema sürümü, hash’i, taşınan yükümlülük kimlikleri |
| **Taşıma** | Yerel: Z3 WASM / worker; Kurumsal: gRPC/HTTP sidecar; Kanıt ağı: `orchestrateRhizohMultiSolverCheckV1` ile çoklu uç |
| **Yaşam döngüsü** | Zaman aşımı, iptal, `unknown` yorumu, politika: “unsat zorunlu” vs “model yeterli” |
| **Entegrasyon kancası** | Mevcut `registerRhizohSmtSolverPlugin` + ağdaki `registerRhizohProofSolverNode` birleşik politika altında seçim |

**Teslimat sırası:** önce tek düğüm WASM veya kontrollü sunucu → sonra Proof Network ile çoklu tanık → en sonda üretim için kaynak kota ve kuyruk.

### 3.2 Kanıt derleme (proof compilation) ardışık düzeni

**İlke:** “Kanıt” tek biçimde değil; en az üç artefakt sınıfı:

1. **Operasyonel tanık** — GPU readback + CPU canonical eşleşmesi (`provePass45FinalizeCanonicalEquivalence`).
2. **Mantıksal özet** — SMT `sat`/`unsat` + model özeti veya redaksiyonlu model.
3. **Sertifika zarfı** — `encodeExternalTruthCertRequestV1` / yanıt ile uyumlu, isteğe bağlı imzalı blob (gelecek faz).

**Boru hattı (hedef):**

```
Yürütme ankoru + IR ──► SMT çağrısı ──► Ham solver çıktısı
                              │
                              ▼
                    Kanıt normalizasyonu (format + hash)
                              │
                              ▼
              Replay / politika birleştirici ──► frame.meta.proofWitness
```

Kodda `proofWitness` alanı bu birleşimin **hedef müşterisi**; şu an çoğu senaryoda yer tutucu veya kısmi doldurma.

### 3.3 Doğrulama çekirdeği (verification kernel)

**İlke:** Küçük, test edilebilir yüzey: “Bu sertifika bu isteğe bağlanıyor mu?” ve “Bu zincir bu ankorlarla tutarlı mı?”

| Bileşen | Görev |
|---------|--------|
| **Sertifika doğrulayıcı** | `createRhizohProofVerifierAdapter` genişletmesi: gerçek imza / zincir-of-trust (veya kurumsal PKI) |
| **IR bağlayıcı** | İstekteki `smtIrDigest` ile gerçekten gönderilen IR uyumu |
| **Sonuç uyumu** | Çoklu çözücü `mergeTrustWeightedSolverResultsV1` çıktısı ile politika eşiği |
| **Zayıf TCB** | Mümkün olduğunca az satır; ağır mantık SMT tarafında |

### 3.4 Kriptografik kapanış (cryptographic closure) katmanı

**Bugün:** `rhizohReplaySeal.js` FNV-1a ile hafif zincir — hızlı, fakat kriptografik olarak **özet bağlayıcı** (collision direnci SHA-256 / BLAKE3 seviyesinde değil).

**Hedef katmanlar:**

| Seviye | İçerik |
|--------|--------|
| **L1** | Her frame için SHA-256 (veya BLAKE3) tabanlı zincir; önceki hash’i açıkça besleyen canonical encoding |
| **L2** | İsteğe bağlı **imzalı** checkpoint (ör. her N kare veya politika olayı) — donanım veya yazılım anahtarı |
| **L3** | Toplu **Merkle** mühür (günlük / seans) — dış depolama ve denetim için tek kök hash |
| **Dürüstlük** | “Kriptografik kapanış” burada **bütünlük ve bağlanabilirlik** anlamındadır; tam formal sistem doğruluğu değildir |

### 3.5 Tam deterministik “replay seal” sistemi

**Bugün:** Zincir, ankor parmak izi ve GPU fingerprint dizgesi ile güncellenir; tam replay için yürütme girişleri tek bir canonical log’da toplanmıyor olabilir.

**Hedef:**

1. **Girdi mührü** — Başlangıç seed, executionMode, topoloji kimliği, sabit nokta sayı kuralları (platform notları ile).
2. **Olay günlüğü** — Uygulanan kararlar, kapı reddleri, dış kanıt sonuçları (referans hash ile).
3. **Yeniden yürütme** — Aynı girdi mührü ile CPU geri dönüş veya kayıtlı GPU komut dizisi ile yeniden koşum; çıktı hash karşılaştırması.
4. **Sapma sınıflandırması** — İzin verilen platform gürültüsü vs politika ihlali (`rhizohDriftStabilizer` ile hizalı).

---

## 4. Fazlı yol haritası (öneri)

Fazlar, `rhizohExecutionRoadmap.js` içindeki **Sovereign Verification** ve mevcut **RELEASE_WAVES** ile hizalanabilir.

| Faz | Ad | Çıktılar | Kapı (örnek) |
|-----|-----|----------|----------------|
| **P0** | Mevcut iskelet sertleştirme | Bridge yükünde proof alanlarının şema stabilitesi; panel/telemetri | Build + manifest yeşil |
| **P1** | SMT alpha | Tek plugin ile gerçek `checkSat` (WASM veya yerel sunucu); zaman aşımı + metrik | En az bir senaryoda uçtan uca IR → sonuç |
| **P2** | Kanıt derleme v0 | Normalleştirilmiş tanık nesnesi + `proofWitness` doldurma sözleşmesi | Kayıtlı tanık yeniden parse |
| **P3** | Doğrulama çekirdeği v0 | İmzasız bile olsa: digest + yanıt alan doğrulaması; çoklu çözücü ile politika birleşimi | Kapı testleri (unit + entegrasyon) |
| **P4** | Replay seal L1 | SHA tabanlı zincir + canonical encoding spesifikasyonu | Aynı log → aynı kök hash |
| **P5** | Kripto kapanış L2/L3 | İmzalı checkpoint + isteğe bağlı Merkle günlük | Denetim senaryosu |
| **P6** | Tam deterministik replay | Girdi mührü + olay günlüğü + yeniden yürütme job’ı | Regresyon deposu ile N senaryo kilidi |

**Bloke edici üretim politikası:** `PRODUCTION_BLOCKING` altında, joint seal + birleşik sözleşme + (hedef olarak) replay doğrulaması tanımlı olmadan agresif iddia yapılmaz — mevcut `fieldTruthV529` dürüstlük metinleriyle uyumlu kalınır.

---

## 5. Okuma ve kavramsal paraleller

- **Egemen çalışma zamanı (sovereign runtime):** Politika, kaynak sınırı ve kanıt kaynaklarının seçimi aynı yönetişim çatısında; Rhizoh’da `swarmGpuBridge` + ön-uygulama kapısı + dış kanıt ağı bu rolü paylaşır.
- **Anlamsal yürütme izleme:** Sıkıştırılmış kimlik + adli iz (`identity compression`, replay zinciri, joint seal) birlikte “ne yürütüldü” sorusuna makine-okur yanıt üretir; tam formal iz ise P2–P6 ile sıkılaşır.

Teknik okuma (genel): SMT pratikleri (Z3 / CVC5 dokümantasyonu), yan süreç doğrulama mimarileri, hash zinciri denetim desenleri (Merkle audit log).

---

## 6. Özet cümle

Rhizoh **Proof Operating System** yol haritası, sistemi “her şeyi kendi içinde kanıtlayan çözücü” yapmak yerine, **epistemik olarak dürüst**, **kanıtı orkestre eden** ve **zamanla kriptografik ve deterministik olarak sıkılaşan** bir çalışma zamanına evirir; mevcut vNext-529 kodu bu yolun **bilinçli ve isimlendirilmiş** ilk katmanlarıdır.

---

*Belge sürümü: 1.0 — `RHIZOH_PROOF_OPERATING_SYSTEM_ROADMAP.md`*
