# Rhizoh çekirdek katmanı (vNext-529) — mimari özeti

Bu belge, `apps/client/src/kernel` altındaki **Rhizoh** yürütme, garanti, kapanış köprüsü ve dış kanıt yüzeylerinin tek sayfalık haritasıdır. Kod içindeki dürüstlük iddialarıyla uyumludur: tam matematiksel kapanış veya bağlı SMT sesliği **iddia edilmez**; yapı, telemetri ve politika kapıları üretir.

## 1. Dürüstlük çerçevesi

- **Üretilen**: yürütme grafiği özeti, truth artefakt sözleşmesi, kimlik / mühür alanları, kanıt tanığı için **iskelet / yer tutucu** yüzeyler.
- **Üretilmeyen (varsayılan)**: gerçek zamanlı bağlı bir SMT çözücü koşumu, formel teorem kanıtı çıktısı, kapanışın matematiksel doğrulanması.
- Teknik çapraz referans: `rhizohExecutionRoadmap.js` içindeki `fieldTruthV529`, `criticalSolverAndProofRealityV529`, `finalSnapshotReportV529`.

## 2. Ana modül haritası

| Alan | Dosya(lar) | Rol |
|------|------------|-----|
| Yol haritası ve snapshot | `rhizohExecutionRoadmap.js` | Fazlar, `RHIZOH_VNEXT_529_RELEASE_SNAPSHOT`, `getRhizohRoadmapManifest()` |
| Garantiler / ön-uygulama kapısı | `rhizohRuntimeGuarantees.js` | `evaluateRhizohPreApplyGate`, `PRODUCTION_BLOCKING`, CPU geri dönüş durumu |
| Canlı kapanış bayrakları | `rhizohClosureRegistry.js` | Üretim hazırlığı sorguları ile uyumlu bayraklar |
| GPU gölge yolu | `rhizohGpuShadowPath.js` | Compute pasları, okuma, mühür alanları |
| Pass45 finalize (WGSL) | `shaders/rhizohPass45DecisionFinalize.wgsl` | GPU karar sonlandırma |
| Karar decode / canonical | `rhizohGpuDecisionFinalize.js`, `rhizohCanonicalEquivalence.js` | Okuma sözleşmesi, CPU–GPU eşdeğerlik tanığı |
| Mühür ve sözleşme | `rhizohJointSealV2.js`, `rhizohUnifiedClosureContract.js`, `rhizohReplaySeal.js` | Zincir ve birleşik sözleşme yüzeyi |
| Sert giriş | `rhizohHardEntryFirewall.js` | Sınır katmanı |
| Drift / CPU yedek | `rhizohDriftStabilizer.js`, `rhizohCpuDeterministicFallback.js` | Zamansal stabilizasyon, deterministik yedek |
| Sözleşme grafiği iskeleti | `rhizohFullClosureContractGraph.js` | Graf özeti |
| Epistemik yüzey | `rhizohEpistemicKernelV1.js` | `buildEpistemicKernelSurface`, `buildEpistemicSmtIrV1` |
| Formalizasyon / zorlama / kimlik | `rhizohFormalizationLayerV1.js`, `rhizohClosureEnforcementLayerV1.js`, `rhizohIdentityCompressionLayerV1.js` | A / B / C evrim hatları ile uyumlu |
| Evrim paketi | `rhizohEvolutionLineV529.js` | `buildInevitableEvolutionLinePack` |
| Formal kapanış köprüsü | `rhizohFormalClosureBridgeV1.js` | `buildFormalClosureBridgePayload` |
| Solver dışsallaştırma v1 | `rhizohSolverExternalizationLayerV1.js` | Tekil SMT eklentisi, kanıt adaptörü stub, IR köprüsü |
| Dış truth protokolü v1 | `rhizohExternalTruthCertProtocolV1.js` | İstek/yanıt zarfı (taşıma katmanı hariç) |
| Dış kanıt ağı v1 | `rhizohExternalProofNetworkV1.js` | Çoklu çözücü, yönlendirme grafiği, güven ağırlığı, delegasyon modeli |
| Birleşik export | `swarmGpuBridge.js` | Uygulama ve ısıtma girişi için toplu export |

## 3. `buildFormalClosureBridgePayload` birleşik yük

Yaklaşık alanlar (sürüme göre genişleyebilir):

- `epistemicKernel` — epistemik yüzey.
- `inevitableEvolutionLine` — A/B/C katman özetleri.
- `solverExternalizationLayer` — tekil plugin, protokol yüzeyi, dış kanıt ağı çapraz referansı.
- `externalProofNetworkV1` — kayıtlı düğümler, varsayılan yönlendirme grafiği, delegasyon politikası özeti.

## 4. Snapshot ve manifest

- `RHIZOH_VNEXT_529_RELEASE_SNAPSHOT` içinde: `solverExternalizationLayerV1`, `externalProofNetworkV1`, `formalClosureBridgeV1`, `closureGapResolutionPackV529`, vb.
- `getRhizohRoadmapManifest()` — Chronos / panel için makine-okur özet.

## 5. Güvenli saklama ve sürüm kontrolü

- Kaynak kod **yerel diskte** `castle` klasöründedir; Cursor düzenlemeleri dosyaya yazılır; ek bir “buluta otomatik kayıt” yoktur.
- **Uzak yedek** için Git kullanın: depo kökünde `git init`, anlamlı commit’ler, isteğe bağlı `git remote add` ile GitHub/GitLab vb.
- Bu belgenin yazıldığı ortamda kökte `.git` yoksa, bir kez `git init` ve `.gitignore` (zaten `node_modules`, `dist`, `.env*` dışlıyor) yeterli başlangıçtır.
- Gizli anahtarları asla commit etmeyin; ayrıntı: `docs/SECURITY_HARDENING.md`.

## 6. İlgili üst belgeler

- [`RHIZOH_PROOF_OPERATING_SYSTEM_ROADMAP.md`](RHIZOH_PROOF_OPERATING_SYSTEM_ROADMAP.md) — DEEPOR vizyonu, SMT / kanıt derleme / doğrulama çekirdeği / kripto kapanış / deterministik replay faz planı.
- `README.md` — monorepo girişi ve Rhizoh Brain v6 notu.
- `docs/SECURITY_HARDENING.md` — güvenlik sertleştirme.
- `docs/ARCHITECTURE_REALTIME.md` — gerçek zamanlı mimari.

---

*Son güncelleme: Rhizoh External Proof Network v1 ve Solver Externalization v1 dahil edilmiştır.*
