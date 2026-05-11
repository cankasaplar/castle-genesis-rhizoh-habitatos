# Post-freeze gerçek mimari durum (özet)

Bu belge, **Frozen Core v1** sonrası sistemin üç katmanını ve **neyin makineyle / neyin süreçle** korunduğunu tek sayfada sabitler. Ayrıntılı freeze politikası: [`STABILIZATION.md`](../STABILIZATION.md). Sprint ve core/research ayrımı: [`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md).

See [`architecture/AWS_CONSTITUTIONAL_SUBSTRATE_PHASES.md`](architecture/AWS_CONSTITUTIONAL_SUBSTRATE_PHASES.md) for constitutional substrate reference-layer topology.

---

## 1. Executable Core (kesin gerçeklik)

**Kapsam:** **v562 → v570** tam zincir (graf doğrulayıcıdaki düğümler ile uyumlu).

| Versiyon | Rol |
|----------|-----|
| **v562** | Kimlik + collapse başlangıç topolojisi (`phaseIdentityAndCollapseV562.js`); kernel’e beslenen monitör/olay hattı. |
| **v563** | Kısıt çekirdeği — sert limitler, veto, faz adımı tavanı, coupling zarfı. |
| **v564** | Zamana göre adaptif politika uyumu (deterministik). |
| **v565** | Denge ankrajı — adaptasyon sönümü, baseline çekimi. |
| **v566** | Plastik baseline / triaksiyel gözlem çıktısı (`budget01`, meta-stability readout). |
| **v567** | Gözlem–kontrol bağlama — yumuşatma, histerezis, gecikmeli uygulama. |
| **v568** | Güven kalibrasyonu (`trust01`, `bypassUrgency01`). |
| **v569** | Güven drift öğrenimi — churn → epistemik bias, gecikmeli güven ölçeği. |
| **v570** | Epistemik hata anlambilimi — benign / harmful ayrımı → öğrenme ağırlıkları. |

**Yapısal hakem:** yönlü asiklik grafik (DAG), import yönü kısıtı, döngü yasağı, niyet dokümanının hash kilidi, CI.

- Niyet grafiği: [`STABILIZATION_GRAPH.md`](../STABILIZATION_GRAPH.md)  
- Doğrulayıcı: `scripts/validateStabilizationGraph.mjs`  
- Hash kilidi: `scripts/stabilization-graph.sha256.lock`  
- Gateway ref özetı: `apps/gateway/src/realityContractLockV1.js` (`phaseEpistemicErrorSemanticsRef: "v570"` vb.)

**Bu katman şu sorunun tek hakemidir:** *Repo’da bu çekirdek zincir gerçekten ne import grafiği ve kilitlenmiş kenarlarla çalıştırılıyor?*

**v562’yi dahil etmenin anlamı:** Çekirdek “düz kernel listesi” değil; **graf kökünden** (kimlik/collapse topolojisi → kernel) başlayan bir DAG. Başlangıç koşulu yalnızca “policy identity” değil; collapse/olay hattı ile bağlı bir **üst giriş topolojisi** vardır.

---

## 2. Policy / Spec Layer (yarı-makine + süreç)

| Bileşen | Rol |
|---------|-----|
| [`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md) | `CORE-ELIGIBLE` / `RESEARCH-ONLY` / `FUTURE-PROOF-ONLY` — backlog sınıflandırması. |
| [`STABILIZATION.md`](../STABILIZATION.md) | Davranışsal freeze, izinli değişiklikler, import kuralı, production safe mode placeholder. |
| [`SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md`](SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md) | Academic × robotics sprint hazırlığı; iddia vs kanıt matrisi. |
| **L0–L13** (anlatı) | Yol haritası / mental model; **CI’da tek başına çalıştırılan runtime değil**; core ile karıştırılmamalı. |

**Makine bağlantısı (kısmi):** `scripts/validateSpecflowCoherence.mjs` — politika belgelerinin varlığı, etiket sözlüğü, çapraz linkler. `npm run stabilization:validate-specflow`.

**Bu katman şu soruya yanıt verir:** *Bunu nasıl düşünmeli, hangi iş hangi sınıfta?* — Runtime’ı tek başına zorunlu tanımlamaz; çekirdek davranışı **Executable Core** belirler.

---

## 3. Epistemic Layer (modelleme alt hattı)

**v567–v570** içindeki sıra (tek tick düşüncesiyle uyumlu):

**observation (readout)** → **trust** → **delay / coupling** → **trust learning (drift)** → **error semantics (sınıflandırma)**

**Kritik fark:** Sistem yalnızca “doğru çıktı” iddiası taşımak zorunda değil; **yanlışlığın veya şüpheli durumun nasıl sayılacağını** (churn, bias, benign vs harmful) **deterministik kurallarla** modelemeye odaklanır.

Resmi çekirdek adı (repo): **Bounded Epistemik Adaptif Kontrol Sistemi (Frozen Core v1)** / **Bounded Epistemic Adaptive Control System (Frozen Core v1)**.

**Sınıf (terminoloji):** **deterministic constrained epistemik kontrol sistemi** — çekirdek stokastik model değildir; DAG, CI guardrail’leri ve epistemik katman sayısallaştırılmış deterministik kurallarla çalışır.

**Mimari sınıf (özet):** **constraint-driven runtime architecture** — feature/config/model tek başına otorite değil; çalışan kod **graf + politika + kilitlenmiş topoloji** ile sınırlanır.

**Teknik özet ifade:** *Yönlü asiklik epistemik DAG; katmanlı spec doğrulaması; güven koşullu, gecikmeli kontrol geri beslemesi (deterministik çekirdek).*

Daha sade: **Davranışı graf ile sabitlenmiş, açıklaması belgeyle sabitlenmiş, gözlem/yanlış-sayım epistemik katmanla modellenmiş runtime.**

---

## 4. Freeze tanımı (net)

**Freeze ≠ geliştirme yok.**  
**Freeze = davranış topolojisi ve frozen zincirin rol ayrımı değişmez** (yeni davranış v571+ veya `experimental/`).

**Freeze’in pratik anlamı:** Sistem “her zaman mutlak doğruyu üreten oracle” değildir; **neyin yanlış veya riskli sayılacağını ve bunun öğrenmeye nasıl yansıyacağını** sınırlı bir uzayda **deterministik** tutar.

---

## 5. Sınırlar — ne zorunlu olarak enforce edilmiyor

| Alan | Durum |
|------|--------|
| **GitHub PR/issue etiketleri** (`CORE-ELIGIBLE` vs `RESEARCH-ONLY`) | Varsayılan olarak **süreç**; ileride Action ile zorunlu kılınabilir. |
| **Tam formel kanıt** (SMT sesliliği, model checking, encoding kanıt zinciri) | **Research / ayrı sprint**; kernel dokümanı bağlı SMT’yi varsayılan üretmez ([`RHIZOH_KERNEL_VNEXT529.md`](RHIZOH_KERNEL_VNEXT529.md)). |
| **Üretim ölçeği SLA** (digital twin gecikmesi, Firebase maliyeti) | Operasyon ve staging ölçümü; frozen core’un parçası değil. |
| **`CASTLE_REALITY_CONTRACT_LOCK_SHA256`** | Ortamda set edilmezse gateway kilidi gevşek kalabilir; ayrı operasyon adımı. |
| **Production safe mode** (kill-switch, rollback epoch) | [`STABILIZATION.md`](../STABILIZATION.md) içinde placeholder; implementasyon ayrı iş paketi. |

**Sınıf özeti:** Bu yapı **tam otomatik formel doğrulama sistemi değil**; **yarı-formel, CI-kısıtlı, kontrollü yazılım epistemolojisi** — executable gerçeklik graf + hash + testlerde; spec gerçekliği belge + kısmi coherence check + review’de.

---

## 6. Habitat execution context (persistent task identity)

**Habitat**, aynı frozen çekirdek üzerinde **bağlamsal çalışma modu**dur (ör. Academic sprint): kim hangi artefact’ı üretir, hangi SPECFLOW etiketi geçerli, frozen dosyalara dokunulur mu — bunlar repoda sabitlenir; Cursor Agent için [`.cursor/rules/frozen-core-habitat.mdc`](../.cursor/rules/frozen-core-habitat.mdc) ve kök [`AGENTS.md`](../AGENTS.md) bağlar.

- Academic sprint alanı: [`SPRINT_HABITAT_ACADEMIC.md`](SPRINT_HABITAT_ACADEMIC.md)  
- Ortak öğrenme süreci (Nisa + harici LLM / academic reviewer): [`HABITAT_COLLABORATION_ACADEMIC.md`](HABITAT_COLLABORATION_ACADEMIC.md)

Çekirdek **değişmez**; habitat yalnızca **izinli dosya ve süreç** katmanını tanımlar.

**İnce çizgi:** `.cursor/rules`, `AGENTS.md` ve habitat dokümanları birlikte **soft execution policy** oluşturur (`kim`, `hangi bağlamda`, `neyi düşünür`); **execution engine** değildirler — motor yine frozen kod + graf/hash doğrulamasıdır. Koordinasyon düzeyi: **code system → coordination system** (ne çalıştığı kadar, **kim hangi bağlamda neyi düşünebilir** de sabittir).

Akademik oturum izi için: [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md). Üç yüzeyin resmi ayrımı (TAL / ECG / CIL): [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md).

**Varlık / asset soyutlaması (spec → mapping → execution):** Üç katmanlı görsel–dünya hattı [`ASSET_CONTRACT_SPEC.md`](ASSET_CONTRACT_SPEC.md) ve [`ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md) ile tanımlıdır; frozen çekirdek bunları **import etmez**. Özet tez: *Assets are not entities in the system; they are projections of a constrained world-state mapping layer* — yani **constraint-driven epistemik sistem**, isteğe bağlı **perceptual projection**.

**Çoklu gözlemci politikası:** [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) — *Agents may influence interpretation, never execution.* Genişleme: [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md). Attribution: [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md).

**Laboratuvar evren snapshot (replay/diff):** [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md) — kernel genişlemez; manifold **gözlemlenebilir snapshot** ile kaydedilir.

---

## İlgili komutlar

```bash
npm run stabilization:validate-graph
npm run stabilization:validate-specflow
```

---

*Son güncelleme: post-freeze mimari özet; çekirdek sürüm aralığı **v562–v570**.*
