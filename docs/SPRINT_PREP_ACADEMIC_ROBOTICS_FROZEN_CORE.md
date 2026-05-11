# Sprint hazırlığı — Academic × Robotics (Frozen Core v1 ile hizalı)

Bu belge, bir sonraki sprint öncesi **çalışma çerçevesi** ve **geri bildirim matrisi** sunar. Amaç: epistemik çekirdeğin (Bounded Epistemik Adaptif Kontrol — Frozen Core v1) repo içinde **kanıtlanabilir** kısımlarını akademik yazıma taşımak; robotics / digital-twin tarafını ise **ölçülebilir mühendislik hedefleri** olarak ayırmak.

**İlgili sabitler (repo):**

- Sprint/issue sınıflandırması (core vs research): [`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)
- Davranış ve freeze politikası: [`STABILIZATION.md`](../STABILIZATION.md)
- Niyet grafiği: [`STABILIZATION_GRAPH.md`](../STABILIZATION_GRAPH.md)
- Graf doğrulayıcı + doküman hash kilidi: `scripts/validateStabilizationGraph.mjs`, `scripts/stabilization-graph.sha256.lock`, `scripts/print-stabilization-graph-hash.mjs`
- Çekirdek faz katmanları: `apps/client/src/ghost/phase*.js` (v562–v570 zinciri)
- Gateway sözleşme referansları: `apps/gateway/src/realityContractLockV1.js` (`phaseEpistemicErrorSemanticsRef: "v570"` vb.)
- vNext-529 kernel dürüstlük çerçevesi (ne iddia edilir / edilmez): [`RHIZOH_KERNEL_VNEXT529.md`](RHIZOH_KERNEL_VNEXT529.md)
- 3D / görsel yüzey öncesi **semantic asset kontratı** (academic’te zorunlu değil): [`ASSET_CONTRACT_SPEC.md`](ASSET_CONTRACT_SPEC.md), dünya modeli köprüsü: [`ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md)

---

## 1. Durum özeti (şablon metnin güncellenmiş hali)

Proje, salt simülasyon çizgisinden çıkarak **sınırlanmış epistemik adaptif kontrol** düzeyinde bir **donmuş çekirdek** taşır: gözlem (triaksiyel okuma), güven kalibrasyonu, zamansal coupling (yumuşatma / histerezis), adaptasyon + denge ankrajı, güven öğrenimi ve hata anlambilimi tek bir **yönlü bağımlılık grafiği** ile bağlanır; yapı **CI ile doğrulanır**, niyet grafiği **SHA256 ile sabittir**.

**Üretim iddiası sınırı:** Çekirdek deterministik kontrol politikaları ve modül grafiği için güçlü garantiler vardır; ancak “her fizik integrasyonunun Lyapunov stabilitesi”, “canlı SMT’nin tam sesliği” veya “Vlasov limiti yakınsaması” gibi ifadeler **ayrı kanıt veya ölçüm sprintine** bağlanmalıdır (aşağıdaki matris).

---

## 2. Narratif katmanlar (L0, L1, …) ↔ repo gerçekliği

Aşağıdaki tablo, ilettiğin metindeki başlıkları **şimdiki repo durumu** ile eşler. Sprint planında her satır için “Done tanımı” bu sütundan türetilmelidir.

| Başlık / tema | Repo durumu | Sprint notu |
|---------------|-------------|-------------|
| **Frozen Core v563–v570 + DAG** | **Uygulanmış:** import grafiği kilitli, döngü ve yön kısıtı CI’da | Akademik yazı: modül grafiği + tick içi veri akışı şeması (kanıt hedefi: yapısal invariant, davranışsal freeze politikası) |
| **L0: Euler / enerji / Lyapunov** | **Kısmen / ayrı modül:** fizik yolu `ghost`/studio/kernel ile bağlantılı olabilir; tekil kapalı formülün **tüm ürün için geçerli olduğu iddia edilmemeli** | Robotics sprint: hangi integrator, hangi alt sistem (ör. belirli simülasyon adımı); ölçüm: enerji drift grafı |
| **L1: Morton / uzamsal hashing** | **Yol haritasında:** `rhizohExecutionRoadmap.js` (WGSL pipeline dalı) | Akademik: karmaşıklık iddiası için komşuluk yapısı ve worst-case netliği; Robotics: GPU pass gerçek ölçüm |
| **L6–L7: MFA / hidrodinamik limit** | **Genelde vizyon / backlog** — kodda tek satırda “ispatlanmış Vlasov yakınsaması” beklenmez | Akademik tasarım belgesi: varsayımlar + hangi mikroskobik model; Robotics: kısıtlı N için benchmark |
| **L12: SMT / Z3 sesliliği** | **İskelet / politikalar:** kernel ve dış kanıt ağı modülleri; [`RHIZOH_KERNEL_VNEXT529.md`](RHIZOH_KERNEL_VNEXT529.md) bağlı SMT **varsayılan üretmez** | Akademik: encoding doğruluğu + soundness/completeness **kanıt zinciri ayrı**; latency SLA ayrı iş paketi |
| **L13: Radar / ADS-B / Istanbul twin** | **Ürün bağlamına bağlı** (Cesium, gateway, env) — tek belgede “kilitli” denmez | Robotics sprint: veri sözleşmesi, rate limit, offline fallback, doğruluk metriği |
| **Epistemik Orb / mühür HUD** | İstemci epistemik yüzey bileşenleri ile örtüşebilir (`rhizoh/epistemic`) | Ürün sprinti: kullanıcıya gösterilen şey = hangi mühür alanı (hash / seal contract) |

**Metodolojik uyarı (formel mantık):** “Çözücü SAT döndü ⇒ politika ihlali yok” önermesi, yalnızca **formülleştirmenin Γ ile doğru kodlandığı** kanıtlandığında anlamlıdır; SAT çıktısı tek başına semantik sonuç üretmez. Akademik sprintte bu ayrım açıkça yazılmalıdır.

---

## 3. Academic sprint — önerilen çıktılar (artefakt)

Her biri için **sayfa sayısı / süre** yerine “kabul kriteri” kullanın.

1. **Frozen Core teknik notu (internal paper)**  
   - Konular: v566 snapshot → v568 trust → v567 coupling → v569 drift → v570 semantics; observe/decide/apply ayrımı.  
   - Ek: `EXPECTED_CORE_IMPORTS` ile graf eşlemesi (appendix).

2. **Invariant listesi (numbered)**  
   - DAG, forward-only layer index, doküman hash kilidi, gateway `REALITY_CONTRACT_LOCK` ref’leri.  
   - Hangi invariant’ın **kanıtı kod** (validator), hangisinin **kanıtı politika** (STABILIZATION.md).

3. **Risk tablosu: iddia vs kanıt**  
   - Kernel dokümanıyla uyumlu şekilde: üretilen / üretilmeyen yüzeyler ([`RHIZOH_KERNEL_VNEXT529.md`](RHIZOH_KERNEL_VNEXT529.md) §1).

4. **İsteğe bağlı dış yayın özeti**  
   - Yalnızca (1)–(3) iç denetimden geçtikten sonra.

---

## 4. Robotics × Digital twin sprint — önerilen çıktılar

1. **Veri kontratı**: WebSocket / HTTP şeması, sıklık, gecikme üst sınırı, bozuk paket davranışı.  
2. **Performans**: ana iş parçacığı yükü — profile + Worker / ECS ayrımı için ölçülen hotspot listesi (metindeki “Web Worker ECS” darboğazına karşılık).  
3. **Güvenlik ve maliyet**: Firebase / canlı ingest için sampling ve kill-switch (bkz. [`STABILIZATION.md`](../STABILIZATION.md) production safe mode placeholder).  
4. **Senaryo testleri**: tek kullanıcı / tek şehir / tek besleme hattı ile sınırlı E2E; iddia edilen “100k varlık” ölçeği ayrı benchmark işi.

---

## 5. Paylaşılan “çözülen vs kalan” tablosu (ürün puanı olmadan)

Şablon metindeki sayısal olgunluk veya değerleme bandı **repo doğrulaması değildir**; sprint backlog’da yerine aşağıdaki gibi **kanıtlanabilir** satırlar kullanın:

| Çözülen / güçlü | Kanıt kaynağı |
|-----------------|---------------|
| Epistemik çekirdek modül sırası ve import topolojisi | `validateStabilizationGraph.mjs` + CI |
| Niyet grafiği ile doküman bütünlüğü | `STABILIZATION_GRAPH.md` + SHA256 lock |
| Davranışsal freeze politikası | `STABILIZATION.md` |
| Gateway katman ref kilidi | `realityContractLockV1.js` (+ isteğe bağlı SHA env) |

| Kalan / açık | Sprint bağlantısı |
|--------------|-------------------|
| Ana thread fizik / sim yükü | Robotics: profile + Worker planı |
| SMT latency ve güvenlik politikası codec doğruluğu | Academic + kernel: encoding kanıtı; mühendislik: async sidecar |
| Kriptografik mühür sertifikasyon zinciri | Mevcut mühür modülleri + operasyonel anahtar yönetimi sprinti |
| Hipertgraf bellek substratı | Mimari backlog / v571+ veya experimental |

---

## 6. Sprint başlatma checklist (kısa)

- [ ] Her iş kalemi için birincil etiket: `CORE-ELIGIBLE` | `RESEARCH-ONLY` | `FUTURE-PROOF-ONLY` ([`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)).  
- [ ] Bu belgedeki tabloyu iki backlog’a böl: **Academic** ve **Robotics**.  
- [ ] Academic tarafında her teorem cümlesi için **hangi kod veya ölçüm dosyası** eşlenecek netleştirildi mi?  
- [ ] Robotics tarafında her veri hattı için **offline mod** ve **staging limiti** tanımlandı mı?  
- [ ] Frozen Core’a dokunan PR’lar: `npm run stabilization:validate-graph` + ilgili Vitest.  
- [ ] `STABILIZATION_GRAPH.md` değiştiyse: hash lock yenileme (`print-stabilization-graph-hash.mjs`) aynı commit’te.

---

## 7. Kapanış

Bu hazırlık belgesi, bir sonraki sprintte **vasıta metni (pitch)** ile **mühendislik gerçeği** arasında köprüdür: Frozen Core tarafı için güçlü ve denetlenebilir bir temel zaten repoda; akademik ve robotics sprintleri bu temeli **genişleterek** veya **ölçerek** ilerlemeli, çekirdek invariant’ları ise bilinçli bir **v571+ / experimental** çizgisiyle ayırmalıdır.
