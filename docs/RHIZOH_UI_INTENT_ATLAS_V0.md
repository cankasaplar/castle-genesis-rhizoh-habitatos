# Rhizoh UI Intent Atlas (V0)

**SPECFLOW:** `RESEARCH-ONLY` — bu dosya **çalışan motor değildir**; ürün / telemetri / ortak dil için **harita + sözleşme iskeleti**dir. **V0 sonrası:** aynı zamanda **execution semantics contract registry** (yürütme + kanıt + kanonik kimlik taahhütleri). Gerçek yürütme grafiği = kod + CI.

**Amaç:** UI yüzeyini değiştirmeden, sistemin “nasıl konuştuğunu” okunabilir kılmak: **UI → anlam (intent) → yürütme (engine) → durum + log + bellek**.

**Bugün kablolu (V0 slice):**

- `apps/client/src/rhizoh/telemetry/rhizohUiIntentTraceV0.js` — `emitRhizohUiIntent`, `emitRhizohEngineActionTrace`, `newRhizohUiCorrelationId`, `intentLayer` (çekirdek üçlü: atom / spine / classifier)
- `apps/client/src/components/RhizohGatewayBanner.jsx` — `GATEWAY_RETRY` (Yeniden dene)
- `apps/client/src/rhizoh/useRhizohGatewayMonitor.js` — `retry({ correlationId })` ile engine trace
- `apps/client/src/rhizoh/telemetry/rhizohBehaviorSignalsV1.js` — `castle:rhizoh-signal` (`rhizoh.ui.intent`, `rhizoh.engine.action`)

### Davranış izi + isimlendirme (V0)

Eski düz çizgi: **BUTTON → FUNCTION → STATE → LOG** (“event logging system”).

Şimdiki okuma: **semantic execution trace system** — **UI olayı → `RHIZOH_UI_INTENT` → `RHIZOH_ENGINE_ACTION` → durum**; aynı hikâye **`correlationId`** ile birleşir.

#### Çekirdek üçlü

| Kavram | Rol |
|--------|-----|
| **Event (emit)** | **Execution atom** — izlenebilir minimal yürütme birimi |
| **`correlationId`** | **Execution identity** — **temporal spine** (tek zaman çizelgesi omurgası) |
| **`intentLayer`** | **Execution context classifier** — **role axis** (“kim hangi bağlamda?”) |

Aynı `cid` altında: UI niyeti, motor çağrısı, zamanlama, health sinyali vb. **“neden retry oldu?”** sorusu tek omurgada birleşir.

#### Birleşik graph (dual-layer değil)

| Okuma | Soru |
|-------|------|
| **Behavior Graph V0** | Sistem **nasıl davranıyor?** (iç semantik) |
| **Intent-Correlated Runtime Observability Graph** | Sistem **nasıl gözlemleniyor?** (dış izlenebilirlik) |

V0’da ikisi **aynı modele collapse**: tek graph, iki perspektif — **unified model**.

Soyut şema: **düğüm = atomik olay**, **hizalama = `cid` omurgası**, **öznitelik = `intentLayer`**.

```
        event (atom)
            |
        [ cid ]  ← temporal spine
            |
    --------|--------|-------- ...
           ui   system  inferred …  ← role axis (classifier)
```

**`intentLayer` sözlüğü:** `ui` | `voice` | `system` | `system_internal` | `replay` | `inferred`. Varsayılanlar: UI intent → `ui`, engine action → `system`. **`inferred`:** kural türetimli deterministik etiket (stokastik kehanet değil; frozen-core epistemik çizgiyle uyumlu).

#### Atlas’ın rolü

**Atlas V0** = **intent registry seed** + **semantic compiler dictionary (pre-runtime)** — yalnız dokümantasyon değil; Phase 2’deki **Intent Execution Compiler** için sözlük zeminı: *UI intent → canonical command grammar → engine execution*. **Phase 2.5 (hedef):** *normalized command → execution plan → side effects* (tek plan / minimal yürütme).

#### Execution Planning Layer (hedef)

Compiler’dan **sonra** gelen katman: sistem artık **yalnızca tek komut üretmez** — **alternatif yürütme planları** üretir ve **path selection** ile birini (veya sıralı bir bileşimi) seçer. Girdiler: canonical komut(lar), runtime kısıtları, öncelik politikası, mevcut `cid` omurgasıyla uyum. Çıktı: seçilen plan + izlenebilir seçim gerekçesi (deterministik kural seti; “oracle” değil). Bu katman, **semantic execution trace**’e yeni atom türleri ekler: `plan_candidate`, `plan_selected`, `path_aborted` vb. (isimler V1+ sözleşmede netleşir).

#### Phase 2.6 — Plan scoring + Policy Governor (hedef)

**Kaçınılmaz genişleme:** aday planlar üretildikten sonra seçim **yalnızca sıra veya sabit kural** ile kalmaz; **plan scoring** girer:

`plan_score = f(constraints, latency, reliability, user_context, history)`

- **Girdiler** gözlemlenebilir sinyallere bağlı kalmalı (frozen-core ile uyum): gecikme bantları, sağlık / güven vektörü, açık kısıtlar, kullanıcı bağlamı için **policy-allowlist** alanları, geçmiş için **deterministik özet** (ham log değil).
- **Çıktı:** her aday için skor vektörü veya sıralanabilir tek skor; tie-break **yazılı politika** ile (stokastik “en iyi tahmin” değil, aksi açıkça sözleşmede tanımlanmadıkça).

Hemen ardından **Policy Governor Layer**: skor / seçim sonucunu **üstten bağlar** — bütçe, kill-switch, kiracı/regülasyon, risk tavanı, continuity zorunluluğu, “degraded-only” modları. Governor **veto**, **demote**, **alternatif yol zorunluluğu** uygulayabilir; seçilen planı trace’e **`policy_pass` | `policy_veto` | `governor_override`** gibi atomlarla yazar.

**Boru hattı (hedef):** *compiler → planning (çoklu plan) → **scoring** → **governor** (PDL eval + **çakışma çözümü**) → seçilen yol → engine / yan etkiler / `cid` izi*; **aynı `cid`** üzerinden **Policy Explainability** kaydı (ve isteğe bağlı **decision diff**) kararla birlikte veya hemen ardından yayınlanır. **Decision Simulation API** üretim yürütmeyi değiştirmez: aynı değerlendirme bileşenleriyle **dry_run / policy_sandbox** üzerinden **counterfactual** okuma yüzeyi. **Governance Time Travel** aynı **evaluation_core**’u geçmiş `policyBundle` + arşivlenmiş `fact_snapshot` ile besler (üretim fork’u; `time_travel_id`).

#### Policy Definition Language — PDL (hedef)

Governor “içgüdüyle” değil **yüklü, sürümlü politika paketleriyle** karar verir. **PDL**, bu paketlerin **yazım şekli + anlam + uyumluluk** sözleşmesidir (çalışan motor ayrı; önce dil ve audit yüzeyi).

| Soru | PDL cevabı (V0 iskelet) |
|------|-------------------------|
| **Governor neye göre karar veriyor?** | **Fact snapshot** (değerlendirme anında salt-okunur, şema bağlı bağlam: sağlık fazı, `intentLayer`, kiracı / ortam sınıfı, degraded bayrakları, skor vektörü özeti) + **policy bundle** (aşağıda). İkisi birlikte deterministik değerlendirme girdisi. |
| **Kurallar nasıl yazılıyor?** | **Bildirimsel kural** modeli: `when` → **kapalı küme** üzerinde **predicate** (izin verilen alan yolları + karşılaştırıcılar); `then` → **kapalı küme** **effect** (`veto`, `demote`, `require_tag`, `route_only`, `budget_cap`, …). V1’de gömülü rastgele JS yok — yalnızca sözleşmeli ifade (audit + CI şekil doğrulaması için). |
| **Versiyonlama nasıl?** | **`pdlSchemaVersion`**: dil şekli (CI / parser kilitleri). **`policyId`**: paket kimliği. **`policyRevision`**: monoton artan tamsayı (replay’de tek doğru sıra). İsteğe bağlı **semver** yalnızca insan paketleme etiketi. Governor çıktısı / trace: hangi `policyId` + `policyRevision` + `pdlSchemaVersion` ile karar verildiği **atomik** yazılır; böylece “aynı olay farklı gün farklı karar” ayrıştırılabilir. Geriye dönük uyumluluk: **sunset tablosu** + desteklenen şema aralığı (repoda tablo, motor değil). |

**Trace köprüsü:** her governor adımında `policy_eval_started` → … → `policy_pass` | `policy_veto` | `governor_override` (zaten 2.6’da) içinde **PDL kimlikleri** taşınır.

#### Policy Conflict Resolution Layer (hedef)

Birden fazla PDL kuralı **aynı fact snapshot**’ta eşleşince deterministik bir **çözüm katmanı** gerekir (yoksa “sessiz kazanan” = audit kaybı).

| Soru | Çözüm sözleşmesi (V0 iskelet) |
|------|-------------------------------|
| **İki policy aynı anda match olursa?** | Önce **aday kümesi** dondurulur (`rule_id` + `policyId` + `policyRevision` + `layer`). Sonra **çakışma çözüm motoru** tek bir **kazanın kural** veya **birleştirilmiş effect** üretir — rastgele sıra yok. |
| **Override zinciri nasıl çözülür?** | **Katman önceliği** tablosu (ör. `platform` → `org` → `tenant` → `session_override` *yalnızca allowlist’liyse*): üst katman aynı alanda altı **override** eder. Paket içinde **açık `precedence`** (sayısal `rulePriority`) ile ikincil sıra. Zincir, PDL’de **deklare edilmiş** birleştirme modu ile birleşir (`stack`, `merge_effects`, `first_veto_wins`, … — kapalı küme). |
| **Priority semantics nedir?** | **(1)** Katman sırası (global tablo, repoda kilitli). **(2)** Aynı katmanda `rulePriority` (yüksek = baskın veya tersi — **tek yön** sözleşmede sabit). **(3)** İsteğe bağlı **specificity** (daha dar predicate kazanır) — açıkça açılmışsa. **(4)** Hâlâ berabere → **deterministik tie-break** (ör. `rule_id` leksikografik, sonra `policyRevision`). |

**Effect birleştirme:** çakışan `then` etkileri için **kapalı birleştirme sırası** veya **kısmi sıra** (ör. `veto` her zaman nihai) PDL şemasında tanımlı olmalı; uygulama yorumu bırakılmaz.

**Trace:** `policy_conflict_detected` (aday listesi) → `policy_resolution_applied` (`resolution_kind`, `winning_rule_id` veya `merged_effect`, `tie_break_reason`). Aynı `cid` altında replay’de karar yeniden üretilebilir.

#### Policy Explainability Layer (hedef — kaçınılmaz kırılma)

Çakışma çözümü ve governor **çalıştıktan sonra** “neden?” soruları ürün ve audit için **birinci sınıf** olur. Bu katman **doğal dil üretimi değil** (o isteğe bağlı üst katman); kaynak doğruluk **yapısal açıklama kaydı**dır — çözüm motorunun zaten ürettiği adımların **şema bağlı özeti**.

| Soru | Explainability çıktısı (V0 iskelet) |
|------|-------------------------------------|
| **Neden bu rule kazandı?** | `winning_rule_id` + **eşleşen predicate değerlendirmesi** (hangi fact yolları true/false) + uygulanan **precedence adımları** (katman, `rulePriority`, specificity, tie-break kodu). |
| **Hangi layer override etti?** | Sıralı **`layer_override_chain`**: her adımda `{ from_layer, to_layer, field_or_scope, rule_id }` — tabloya göre deterministik üretilir. |
| **Conflict graph nasıl çözüldü?** | **Lineerleştirilmiş çözüm günlüğü** veya **DAG özeti** (düğüm = aday kural / effect; kenar = “elendi çünkü …” / “birleştirildi şu sırayla”); ham graph istenirse ayrı blob, trace’te en azından **özet + hash**. |

**Trace atomları:** `policy_explainability_record` (`cid` ile bağlı; `policyId` / `policyRevision` / `pdlSchemaVersion` içerir). İnsan okuyabilir metin varsa **`narrative_derived_from`** alanı ile yapıya bağlanır (LLM kehaneti SSOT değil).

##### Decision diffing (doğal devam)

Aynı **fact snapshot** üzerinde **Policy A** vs **Policy B** (farklı `policyRevision` veya paket): deterministik **karar diff** — hangi kurallar eşleşti / eşleşmedi, kazanan değişti mi, **effect** ve **skor vektörü** farkı (tanımlıysa), `layer_override_chain` ayrışması. Çıktı: `decision_diff_result` (struct); UI’da “policy diff viewer” bu yapıyı okur.

#### Decision Simulation API surface (hedef)

Soru: **“Bu policy değişirse sistem nasıl davranır?”** — üretim motoruna yazmadan, **API yüzeyi** ile dışa açılır (Studio / gateway / iç araçlar).

| Boyut | Sözleşme (V0 iskelet) |
|-------|------------------------|
| **Girdi** | **Fact snapshot** (inline veya `snapshot_ref`), bir veya daha fazla **aday `policyBundle`**, isteğe bağlı **plan aday kümesi** (planning katmanı simüle edilecekse). |
| **Mod** | `dry_run` (yan etki yok) veya **`policy_sandbox`** (yalnız izole namespace / staging bağlayıcıları — üretim `cid` ile karışmaz). |
| **Çıktı** | `would_win_rule`, `would_effects`, tam **explainability** + isteğe bağlı **decision_diff** (baseline pakete göre). Üretim trace’e yazılmaz; **`simulation_id` / `intentLayer: replay` benzeri** ayrı korelasyon önerilir. |
| **Güvence** | Kimlik / yetki, kota, zaman aşımı; **tek yazarlık yok** — simülasyon governor’ı üretim governor durumunu güncellemez. |

**Trace (sandbox):** `simulation_started` → `simulation_completed` | `simulation_rejected` (kota / yetki / şema hatası).

#### Katman 10 — iki güçlü seçenek (hedef)

| Seçenek | Ne kazandırır? | Not |
|---------|----------------|-----|
| **A) Policy Simulation Runtime** | **Toplu counterfactual**: aynı snapshot üzerinde çoklu paket / parametre ızgarası; **policy sandbox** ile staging paketleri güvenli yürütme. API yüzeyi ile birleşir: batch job + sonuç özeti. |
| **B) Decision Index Layer** | Geçmiş **karar kayıtları** (explainability + fact sınıfı) üzerinde **benzerlik araması** — “buna benzeyen önceki kararlar”. |

**Epistemik ayrım (frozen-core ile uyum):** **Yürütme ve audit SSOT** yapısal kayıt + deterministik anahtarlardır. **Embedding / vektör benzerliği** varsa bunlar **FUTURE-PROOF-ONLY / RESEARCH-ONLY** katmanda **ön seçim (retrieval hint)** olarak kalabilir; “hakikat” veya policy override için tek başına kullanılmamalı. Birinci sınıf benzerlik: **yapısal parmak izi** (ör. predicate sonuç vektörü + `winning_rule_id` + fact sınıfı hash’i) ile arama.

İki seçenek birbirini dışlamaz: simülasyon üretilen sonuçları indeksler; indeks “geçmişte ne oldu?”yu hızlandırır, simülasyon “şöyle olsaydı?”yu yanıtlar.

#### Governance Time Travel Layer (hedef)

**Soru:** Geçmişte hangi politika + hangi dünya özeti ile **ne karar verilmişti**; bugünün motoru veya bugünün politikası ile **aynı girdide ne çıkar**?

| Adım | Anlam |
|------|--------|
| **Geçmiş policy bundle yükle** | Arşivden `policyId` + `policyRevision` + `pdlSchemaVersion` (sunset tablosu ile uyumluluk kontrolü). |
| **Geçmiş fact snapshot replay** | O an dondurulmuş **snapshot_ref** / içerik; üretim durumu **mutasyona uğramaz** — değerlendirme **fork**’u. |
| **Eski vs yeni karar** | Orijinal **explainability** kaydı ile, replay sonrası yeniden üretilen kayıt **aynı decision diff** makinesiyle karşılaştırılır (kural, effect, override zinciri, skor farkı). |

**Birleşen eksen:** Bu noktada **replay** (zaman içinde aynı girdiyi yeniden koşturma), **diff** (iki kararın yapısal farkı), **simulation** (hipotetik paket + snapshot), **explainability** (her koşuda yapısal “neden”) **aynı değerlendirme çekirdeği** etrafında toplanır: *`fact_snapshot` + `policy_bundle` (+ isteğe bağlı plan adayları) → **evaluation_core** → `policy_explainability_record`*; yalnızca girdinin **kaynağı** (`cid` mi, `simulation_id` mi, `time_travel_id` mi) ve **`intentLayer`** ayrışır.

**Zorunlu meta:** Replay sonucu üretimden farklı çıkabilir — **motor `eval_revision`** (governor/scoring sürümü) kaydı tutulur; aksi halde “aynı snapshot neden farklı?” sorusu cevapsız kalır.

**Trace:** `governance_time_travel_started` → `historical_policy_loaded` → `snapshot_replay_forked` → `temporal_decision_diff_completed` | `time_travel_rejected` (uyumsuz şema / yetki).

#### Governance Provenance Graph (hedef)

Karar artefaktları arasında **türetme** ilişkisi: yönlü grafik (tercihen **DAG**); düğümler = `policy_explainability_record`, simülasyon sonucu, replay fork çıktısı, diff paketi; kenarlar = **provenance edge** (kapalı küme `edge_kind`).

| `edge_kind` (örnek) | Anlam |
|---------------------|--------|
| `derived_from_cid` | Simülasyon / sandbox çıktısı şu **üretim `cid`** kararından türetildi. |
| `replay_of_snapshot` | Bu koşu şu **arşivlenmiş `snapshot_ref`** + `policyRevision` üzerinde. |
| `diff_against_baseline` | Karşılaştırma şu **baseline** explainability düğümüne bağlı. |
| `override_lineage` | `layer_override_chain` ile uyumlu; üst katman kuralı altı **supersedes**. |
| `time_travel_fork` | Governance Time Travel oturumu `time_travel_id` ile üretildi. |

**Kullanım:** “Bu simülasyon hangi canlı karardan geldi?”, “Bu diff hangi iki düğüm arasında?”, “Override zinciri hangi graph yolunda?” — audit ve Studio görünürlüğü.

#### Semantic Drift Analysis (hedef)

Soru: **“Aynı policy metni / aynı `policyId` neden zamanla farklı davranıyor?”** — cevap **tek faktörde değil**; izlenebilir **atıf vektörü** ile ayrıştırılır.

| Kaynak | Drift sinyali |
|--------|----------------|
| **`eval_revision`** | Governor / scoring / conflict motorunda **sürüm değişimi** — aynı snapshot + aynı bundle ile farklı sonuç üretebilir. |
| **Skorlama şeması** | `plan_score = f(…)` içindeki **ağırlık veya bant** değişiklikleri (sürümle). |
| **Fact sınıfı** | Snapshot “aynı” sanılırken **şema veya türetilmiş alan** evrilmiş olabilir (hash karşılaştırması). |
| **PDL / şema göçü** | `pdlSchemaVersion` veya kural normalizasyonu — policyRevision aynı kalsa anlam kaymış olabilir. |

**Çıktı:** `semantic_drift_report` — yapısal (hangi eksen ne kadar katkı verdi); doğal dil özet yalnızca **`narrative_derived_from`** ile bağlanır. Ürün içi köprü: repoda başka yerlerde **drift** telemetrisi varsa **aynı sözlük** ile hizalanır (`RESEARCH-ONLY` genişletme).

**Provenance ile birleşim:** Drift raporu, provenance graph’ta **“bu düğüm şu `eval_revision` ile yeniden üretildi”** kenarlarıyla zenginleşir.

#### Governance Query Language — GQL (hedef)

**Castle / Rhizoh Governance Query Language** — **GraphQL ile karıştırılmaz**; API ve dosya önekleri için ayrı isim alanı önerilir (ör. `cgql` / `governance.query.v0`).

Amaç: doğal dil **ürün sorusu** ile değil, **bildirimsel sorgu** ile provenance + explainability + drift + simülasyon artefaktları üzerinde **sınırı çizilmiş** okuma: derleme sonucu **graf yürüyüşü**, indeks araması, zaman aralığı karşılaştırması, (isteğe bağlı) **tanımlı** simülasyon ızgarası — hepsi **auditlenebilir `query_plan`** üretir.

| Örnek soru (ürün dili) | GQL’nin bağladığı yapı (V0 iskelet) |
|------------------------|--------------------------------------|
| **“Bu karar neden override edildi?”** | `explainability` düğümünden **`layer_override_chain`** + `policy_resolution_applied` altgrafı; `edge_kind = override_lineage` yürüyüşü. |
| **“Hangi policy chain bunu değiştirdi?”** | Provenance graph’ta `policyId`/`policyRevision` zinciri: **`supersedes` / `bundle_composes`** kenarları (PDL’de tanımlı birleştirme modeli ile). |
| **“2025 vs 2026 drift farkı nedir?”** | Aynı yapısal anahtarlar üzerinde **`semantic_drift_report` × 2** veya tek raporda **zaman dilimi karşılaştırması** (`eval_revision`, skor şeması sürümü, snapshot şema hash’i). |
| **“Bu decision’ın en olası counterfactual’ı neydi?”** | **Olasılık iddiası yok** (frozen-core): ya **simülasyon ızgarasında `plan_score` + yazılı tie-break ile rank-1** sonuç, ya da **yapısal parmak izine göre en yakın** kayıtlı counterfactual (Decision Index + deterministik mesafe). “En olası” ürün metni = **`rank_label`** + `narrative_derived_from`. |

**Güvence:** Sorgu derinliği / genişlik kota; salt-okunur; sonuç **`governance_query_result`** + **`query_plan`** (hangi düğümler, hangi kenar türleri, hangi `eval_revision`). Trace: `governance_query_submitted` → `governance_query_completed` | `governance_query_rejected`.

#### Governance Compiler Runtime (hedef)

**İkinci derleyici hattı** — yürütme yüzeyi üretim motorunun yerine geçmez; **governance okuma / türetme** yolunu formalize eder:

* **GQL** (bildirimsel sorgu) → **`query_plan`** (graf yürüyüşü + sınırlar) → **governance execution engine** (planı koşturur: altgraf materializasyonu, drift karşılaştırması, sandbox simülasyon çağrıları — **yan etki sınıfı** üretimden ayrı).

Paralel hat (ürün yürütmesi) zaten atlas boyunca:

* **intent** → **command grammar** → **plan** → **execution** (dünya / gateway yan etkileri).

İki hat **aynı soyutlamaya** indirgenecek şekilde tasarlanır: düğümler ve kenarlar **tek bir underlying graph model** üzerinde (aşağıda).

#### Intent + GQL → tek graph modeli (kritik birleşim)

| Girdi yüzeyi | Derleyici çıktısı | Graf rolü |
|--------------|-------------------|-----------|
| **Intent** (UI / ses / sistem) | canonical komut + plan adayları + motor çağrıları | **Yürütme atomları** + `cid` omurgası + `intentLayer` |
| **GQL** | `query_plan` | **Okuma / türetme atomları** (explainability, provenance yürüyüşü, drift slice) — üretim `cid`’e **referans** verir, aynı düğüm türleriyle hizalanır |

Böylece **aynı graf modeli** iki derleyiciye ortak olmalı; cebir tanımlandıktan sonra **formal doğruluk** için eksik parça **operatör tip sistemi** olur (aşağıda).

#### Unified execution algebra (hedef — son eksik parça)

**Birleşik yürütme cebiri:** Kapalı bir **operatör kümesi** — hem governance (çoğunlukla salt-okunur) hem ürün yürütmesi **aynı IR**’a (veya aynı graf cebirine) düşer. Örnek aile (isimler yer tutucu): `EMIT` (atom üret), `BIND` (`cid` / `simulation_id` bağla), `FORK` (snapshot fork), `EVAL` (policy + fact → explainability), `DIFF`, `RANK` (yazılı tie-break ile), `WALK` (provenance). Alt küme = **salt-okunur governance cebiri**; üst küme = yan etkili **world cebiri** — ayrım **operatör izinleri** ile, iki farklı evren modeli ile değil.

**Sonuç (şu an):** Intent derleyicisi ve GQL derleyicisi **aynı underlying graph modelini** hedefler; **unified execution algebra** bu modelin **kapak cebiri**dir. **Cebir + graf + derleyici + lineage** sözleşme düzeyinde **tamam**; **operatör doğruluğu** için **tek gerçek kalan kapak**: **Operator Type System V1+** — özellikle aşağıdaki **formal inference rules** (şu an yarım).

#### Operator type system — formal `EMIT` / `BIND` / `FORK` … (hedef)

**Amaç:** Her operatörün **giriş / çıkış sortları**, **yan etki sınıfı** ve **lineage bağları** için **yargı kuralları** (`Γ ⊢ op : τ`) — böylece “geçerli `query_plan` / geçerli yürütme IR’ı” **CI’da statik** olarak reddedilebilir (dangling handle, governance bölgesinde `writeWorld`, uyumsuz `FORK`+`EVAL`, vb.).

| Boyut | İçerik (V0 iskelet) |
|-------|---------------------|
| **Düğüm sortları** | Kapalı `NodeKind`: örn. `IntentAtom`, `EngineActionAtom`, `ExplainabilityRecord`, `FactSnapshotRef`, `PolicyBundleHandle`, `SimulationResult`, `DriftReport`, … — her düğüm şema sürümü taşır. |
| **Kenar sortları** | Her `edge_kind` için **imza**: `(src: NodeKind, dst: NodeKind)` + isteğe bağlı **bağımlı alan** (ör. `derived_from_cid` yalnızca `ExplainabilityRecord` → `IntentAtom` veya `CidAnchor`). |
| **Operatör imzaları** | Örn. `EMIT : Γ → Atom × CidExtension`; `BIND : Plan × Handle(τ) → Plan'` (handle çözülmüş bağlam); `FORK : FactSnapshotRef × SandboxCap → ForkCtx`; `EVAL : ForkCtx × PolicyBundleHandle → ExplainabilityRecord`; `WALK : NodeRef × EdgeKindSet → Subgraph`; `DIFF : ExplainabilityRecord × ExplainabilityRecord → DiffRecord` — gerçek imza tablosu V1+ şemada kilitlenir. |
| **Etki / yetenek satırı** | Her operatör `pure` \| `readGraph` \| `readIO` \| `writeWorld` etiketinden bir veya **sıralı etki birleşimi** (kapalı kural); **governance-only** bölgede `writeWorld` **yasak** (tip hatası). |
| **Lineage tipleri** | `ProvenanceEdge e` için **kanıt** alanları: `e.from` düğümünün `eval_revision` / `policyRevision` uyumu; “bu türetme şu omurgaya bağlı” **bağımlı tip** benzeri kısıtlar (uygulama = şema + doğrulayıcı). |
| **Doğruluk özeti** | **İlerleme:** iyi tiplenmiş IR → tanımsız referans yok, yetki ihlali yok, salt-okunur alt cebirde yan etki yok. **Tam kanıt** V1+ hedefi; V0’da **yargı tablosu + CI doğrulayıcı** yeterlilik eşiği. |

**Pratik:** `scripts/validateOperatorIrV0.mjs` — kural SSOT `docs/schemas/operator-inference-v0.rules.json`, Γ şeması `docs/schemas/operator-inference-v0.gamma.schema.json`, `evaluateOperatorIrV0` + `--trace`, proof AST + `--proof`, **canonical digest** + `--canonical` (A1–A3 + C tohum). `npm run stabilization:validate-operator-ir-v0` · `node scripts/validateOperatorIrV0.mjs --trace|proof|canonical path/to/ir.json`. V1+’te kural tablosu + Γ alanları genişler; `STABILIZATION` / graph lock ile aynı ritimde sürümlenir.

#### Operator Type System V1+ — formal inference rules (typing judgments) (hedef, tek gerçek “kapak”)

Sortlar ve operatör isimleri **yarım tip sistem**dir; V1+’te kapatılacak parça **çıkarım kuralları**: her operatör için **önkoşullar** Γ üzerinde eksiksiz yazılır; geçerlilik `ok` veya **sabit hata kodu** ile biter (CI statik kontrol).

**Şablon (okuma notasyonu — tam kural kümesi ayrı şema + doğrulayıcı):**

```
Γ ⊢ EMIT : ok     iff   intentLabel ∈ Γ.atlas ∧ intentLayer ∈ AllowedLayer ∧ cid_alloc policy satisfied
Γ ⊢ BIND(h) : ok  iff   h ∈ dom(Γ.handles) ∧ sort(h) = τ ∧ τ plugs hole in Γ.plan
Γ ⊢ FORK(s, κ) : ok   iff   ⊢ s : FactSnapshotRef ∧ ⊢ κ : SandboxCap ∧ Γ ⊢ sandbox_cap(κ) : ok
Γ ⊢ EVAL(ctx, π) : ok   iff   ⊢ ctx : ForkCtx ∧ ⊢ π : PolicyBundleHandle ∧ snapshot_schema_compat(ctx.snapshot, π)
Γ ⊢ DIFF(a, b) : ok   iff   ⊢ a : ExplainabilityRecord ∧ ⊢ b : ExplainabilityRecord ∧ diff_comparable(a, b, Γ.mode)
Γ ⊢ WALK(n, E) : ok   iff   n ∈ vertices(Γ.graph) ∧ E ⊆ EdgeKind ∧ subgraph_closed(Γ.graph, n, E)
```

**“EMIT valid if …” / “FORK valid if …” / “DIFF requires …”** ifadeleri bu yargıların **doğal dil yüzeyi**dir; SSOT **kural tablosu + şema**.

#### Mimari olgunluk (atlas / sözleşme perspektifi — şu an)

| Aşama | Durum |
|-------|--------|
| Event system | Tamam |
| Graph model | Tamam |
| Compiler surfaces (intent + GQL) | Tamam |
| Policy engine (PDL + conflict + explainability) | Tamam (hedef sözleşme atlas’ta) |
| Simulation / time travel / provenance / drift / GQL | Tamam (hedef sözleşme) |
| Algebra (operatör ailesi) | Tamam (iskelet) |
| **Type system** (A: rules + Γ + trace) | **Yarım** — V0 tohum; V1+ genişletme |
| **Proof / certificate (C)** | **Tohum** — proof AST + **canonical digest** (`--canonical`, `operator-proof-canonical/0.1.0`) |

#### Sonraki adım — A / B / C (önerilen sıra)

| Kod | İçerik | Rol |
|-----|--------|-----|
| **A** | **Inference rule formalization** — `Γ ⊢ …` yargılarının **sistem spec**’i (makine-okur kural tablosu + atlas SSOT + kural `id`) | **Önce bu** — B ve C’nin dayanağı; `validateOperatorIrV0` buradan beslenir. |
| **B** | **Operator algebra** ile **type system**’in kod/şema ayrımı (cebir IR vs yetenek / sort IR) | **İkinci** — A kilitlenmeden refactor erken dalgalanır. |
| **C** | **IR → canonical proof tree** üreteci (geçerli IR + uygulanan kural zinciri = denetlenebilir kanıt ağacı) | **Üçüncü** — doğrulayıcı ile **aynı kural kimlikleri**; yoksa “proof” ile “validator” çatışır. |

**Tek cümle:** Doğru sıradaki kapak **A**; ardından **B**, en sonda **C**.

##### Zorunlu bağımlılık (formal sıra)

**A ⟹ B ⟹ C** — ters yön ses tutmaz: **C**, A olmadan *sound* olamaz (kanıt, yanlış semantiği de “düzgün” anlatır). **B**, A olmadan stabilize olmaz (tek düzlemde cebir + tip karışır). Üçlünün anlam sırası:

| Katman | Rol |
|--------|-----|
| **A** | **Truth definition** — ne legal? (`rule_id`, predicate uzayı, Γ alanları, iff) |
| **B** | **Computation model** — ne hesaplanır vs ne doğrulanır? (cebir / tip / yetenek ayrımı) |
| **C** | **Auditability** — neden bu sonuç? (`execution trace = derivation trace`, `rule_id` hizası) |

**Akış:** anlam (**truth**) → yapı (**computation**) → kanıt (**proof**). `validateOperatorIrV0` artık A’nın **proto-derleyicisi** değil: **kural SSOT** + **Γ şeması** + **`rule_id` anotasyonlu değerlendirme izi** (A1–A3 tohumları repo’da).

| Alt adım | Artefakt | Durum (V0 tohum) |
|----------|----------|-------------------|
| **A1** | `docs/schemas/operator-inference-v0.rules.json` — kural kimliği + `evaluator` + `formal.{gamma,iff}` | **Var** |
| **A2** | `docs/schemas/operator-inference-v0.gamma.schema.json` — Γ nesnesi (region, handles, …) | **Var** |
| **A3** | `evaluateOperatorIrV0` → `evaluationTrace[]`; CLI `--trace` | **Var** |

#### Epistemik yürütme sözleşmesi ve atlas rolü (V0)

**Atlas artık yalnız “dokümantasyon” değil** → **execution semantics contract registry**: “ne yapıyoruz” değil, **sistem ne üretmek zorunda** (yürütme anlamı + kanıt şekli + kanonik kimlik).

**Boru hattı dönüşümü:** eskiden *execution → validation → logging* iken şimdi:

*execution → **derivation** (trace + `rule_id`) → **canonicalization** → **content-addressed proof object** (`canonical_sha256`).*

**Kalıcı epistemik üçlü (karışmaz):**

| Katman | Adı | Taşıyıcı |
|--------|------|----------|
| **A) Runtime truth** | yürütme anlık gerçeği | **trace** (`evaluationTrace`) |
| **B) Canonical truth** | hash-stabil taahhüt | **proof** + **`sha256(canonical_json)`** |
| **C) Descriptive layer** | açıklama / yol haritası / UI bias riski | **meta**, `narrative_derived_from` |

**body / meta** = **epistemik sınır**: explanation ≠ truth → debug sızıntısı, explanation drift ve UI narrative bias digest’e **giremez**.

**Determinizm stratejisi:** `sortKeysDeep` = **controlled determinism (V0.1)**; **RFC 8785 (JCS)** = global interoperable determinism (V0.2 seçeneği) — ikisi de “format” değil, **determinism strategy** seçimi.

**Taahhüt (governance sınıfı):** aynı girdi + aynı policy + aynı evaluator sürümü → **aynı proof hash** → **reproducible governance computation class**.

**Sınıf (net isim):** **deterministic epistemic execution system** — aşağıdaki İngilizce özet ile aynı çerçeve.

**Alt sınıf (governance motoru):** **content-addressed governance computation engine** — yürütme sonucu **adreslenebilir**, yeniden üretilebilir.

| Eski atlas | Yeni atlas |
|------------|------------|
| Dokümantasyon / mimari açıklama / geliştirme notu | **Execution semantics contract registry** — sistemin *ne yaptığını anlatan* değil, *ne yapmak **zorunda** olduğunu kilitleyen* yüzey |

**“Log = gerçek” kırıldı:** trace **akışsal ve geçici**; kanonik truth **proof + hash**; anlatı **meta** — **log artık semantics taşımıyor**, taşıyan yalnızca **proof gövdesi** (UI narrative SSOT değil).

**Boru hattı = yalnız “pipeline” değil:** *execution → derivation → canonicalization → proof object* ifadesi **deterministic compilation chain**’i okur — *runtime değil*; **compile-time epistemik üretim** (yürütme anı derlenir → kanıt artefaktı).

| Mod | Anlam |
|-----|--------|
| **Controlled** (`sortKeysDeep`) | Kapalı sistem determinism — *internal correctness optimized* |
| **Interoperable** (RFC 8785 / JCS) | Ekosistem determinism — dış dünya ile bayt uyumu |

**Epistemik cümle (küçük ama sert):** *explanation is not part of truth* — açıklama truth’un parçası değil; **tekil gerçekler yığını** değil, **ilişkisel gerçeklik** (kanıtlar arası bağ) için zemin.

**Şu an:** doğru, deterministik, izlenebilir. **Cross-proof sonrası:** **meaning-aware computation graph** — proof = **identity** (bugün) → proof = **relation** (yarın: aynı / benzer / türemiş / lineage).

**İngilizce durum özeti:** *The system has been formalized into a deterministic epistemic execution framework where runtime traces, canonical proofs, and descriptive metadata are strictly separated, and governance computation is content-addressed and reproducible.*

**C (tohum) — trace → proof tree AST:** `buildOperatorProofTreeV0(ir, result)` → `operator-proof-tree/0.1.0` sertifika iskelesi; CLI `--proof`. Trace artık yalnızca “log” değil, **yapısal kanıt gövdesi** (verdict + bloklanmış türetim ağacı).

**Canonical normalization (V0.1):** `sortKeysDeep` + `proofTreeCanonicalBodyV0` (digest’e **meta** ve **error_count** girmez) → `canonical_sha256` (`operator-proof-canonical/0.1.0`); CLI **`--canonical`** (= proof + `attachCanonicalProofNormalizationV0`). Aynı anlamsal ağaç → **aynı bit dizisi** (`canonical_json` byte-stabil).

| Taahhüt (V0.1) | Anlam |
|----------------|--------|
| **Yapısal determinizm** | `sortKeysDeep` = **deterministic serialization contract** (anahtar sırası invariant; yapısal eşdeğerlik → bayt eşdeğerliği). |
| **Anlamsal determinizm** | Aynı trace → aynı proof AST (önceden: structured ama stabil olmayan temsil). |
| **Kimlik determinizm** | `proof_identity = sha256(canonical_json)` — kanıt **adreslenebilir**, hash’lenebilir artefakt (signed object değil; **content-addressed** zemin). |

**body vs meta:** digest **yalnızca semantik truth** (`body`); `meta` (ör. `roadmap_evaluator_registry`) **projection / gürültü** — açıklama truth’un parçası değil. `inputs.roadmap` → `meta` taşıması = **execution semantics vs metadata** ayrımı.

##### Cross-proof equivalence layer (hedef — bir sonraki üst kırılma)

**Hash eşitliği ≠ anlamsal eşitlik.** Bir sonraki katman: **proof A ≈ proof B** (aynı sonuç ≠ aynı neden) — **semantic equivalence** için projection + normal form (rule_id çoklu kümesi, verdict sınıfı, `eval_revision` stripped view). Sonraki olgunluk: **identity → similarity → lineage graph**; yüzeyler: **proof clustering**, **drift topolojisi**, **policy evolution** izi, **governance similarity index** (yapısal mesafe / embedding — LLM kehaneti değil; frozen-core hizası). Araçlar: kanonik proof embedding (structure-only), CID-benzeri küme indeksleri (ürün dili). V0.2: JSON Schema veya **RFC 8785 (JCS)** = **implementation normalization strategy** (custom vs interoperable).

**İleride stabilize:** `evaluator` string’leri şu an **procedural fallback**; hedef **versioned evaluator registry**: `rule_id` → kayıtlı fonksiyon + sürüm, SSOT ile kilit.

#### Observer mode (operasyon — UI’a dokunmadan)

**Kısıt:** yeni buton / layout yok — yalnız **gözlem**. Üretim veya staging’de canlıyı bozmadan şu sinyalleri oku:

| Kanal | Ne |
|--------|-----|
| **Konsol** | `[RHIZOH_UI_INTENT]` → `[RHIZOH_ENGINE_ACTION]` → `[CASTLE_BOOT]` / gateway logları |
| **`cid` zinciri** | Aynı `cid` altında intent → engine → (retry / health) birleşiyor mu |
| **`intentLayer`** | `layer=` (`ui` / `system` / …) akışı tutarlı mı |
| **Gateway faz** | `uncertain` ↔ `connected` / `offline` geçişleri, debounce / churn notları |

**Pratik (şu an):** DevTools konsolu açık; gateway health tick ve faz flip’lerini izle; `castle:rhizoh-signal` dinleyicisi (isteğe bağlı) ile `rhizoh.ui.intent` / `rhizoh.engine.action` ayrımı.

**Üç kontrol sorusu:**

1. **Flap** var mı? (sık faz değişimi, sıra dışı health cevapları)  
2. **`cid` continuity** kırılıyor mu? (aynı kullanıcı eylemi farklı `cid`’e dağılıyor mu)  
3. **`intentLayer` dağılımı** tutarlı mı? (UI eylemi `system` ile karışıyor mu, replay karışması)

**Mod kararı:** “Şimdiye dön” veya “timeout ile zorla” **zorunlu değil** — doğru postür: **observe + stabilize** (zaten koyduğun belirsizlik / sıralama / rolling güven katmanları bu modun motoru).

**Özet cümle:** UI yalnızca “çalışan ekran” değil; üstünde **observable execution graph runtime** çalışıyor — observer mode bu grafiği **dokunmadan** okumaktır.

#### Tek cümle (mimari özet)

**UI artık yalnızca “input” değil, intent üretim yüzeyi; sistem ise `cid` üzerinden birleşen çok-rollü bir execution graph.**

---

## 1. Mental map — üç katman

| Katman | Rol | Örnek çıktı |
|--------|-----|----------------|
| **UI** | Kontrol yüzeyi (buton, sekme, ses, metin) | tıklama |
| **Intent** | Anlam + kaynak + (isteğe bağlı) korelasyon | `GATEWAY_RETRY` + `cid` |
| **Engine** | Gerçek çağrı + durum güncellemesi | `useRhizohGatewayMonitor.retry`, health poll |

**Konsol okuması:** `[RHIZOH_UI_INTENT]` → `[RHIZOH_ENGINE_ACTION]` → (mevcut) `[CASTLE_BOOT]` / gateway faz logları.

---

## 2. Alan bazlı atlas (A–E) — hedef sözlük

Aşağıdaki **Engine action** sütunu, çoğu yerde **hedef isim** (refactor / envanter sonrası bire bir eşlenecek); bugünkü kodda bire bir fonksiyon adı olmayabilir. Envanter sırasında her satır `WIRED` | `PARTIAL` | `PLANNED` ile işaretlenecek.

### A) Gateway / health zone

| UI (soyut) | Intent | Engine action (hedef) | Output state (hedef) |
|------------|--------|-------------------------|----------------------|
| Retry / reconnect | `GATEWAY_RETRY` | `useRhizohGatewayMonitor.retry` + effect yeniden bağlanma | `connected` / `uncertain` / `offline` |
| Refresh health (manuel) | `GATEWAY_REFRESH` | `fetchGatewayDepsOnce` / tek tick | `healthDeps`, `healthSignalSnapshot` |
| Monitor toggle | `GATEWAY_MONITOR_TOGGLE` | poll schedule aç/kapa (tasarım) | polling active/inactive |
| Debug health surface | `GATEWAY_DEBUG_VIEW` | `healthSignalSnapshot` / panel köprüsü | telemetry UI |

**Wired (V0):** `GATEWAY_RETRY` → banner + `retry({ correlationId })`.

### B) World / map zone

| UI (soyut) | Intent | Engine action (hedef) | Output |
|------------|--------|------------------------|--------|
| Layout / view | `WORLD_LAYOUT_SWITCH` | reality / map shell dispatch | layout / focus |
| Camera / focus | `WORLD_FOCUS_NODE` | director / Cesium bridge | viewport |
| Reset view | `WORLD_RESET_VIEW` | camera / home anchor | neutral view |
| Node select | `WORLD_SELECT_NODE` | selection + trace | highlight + graph |

### C) Engine control zone

| UI (soyut) | Intent | Engine action (hedef) | Output |
|------------|--------|------------------------|--------|
| Pause | `ENGINE_PAUSE` | world loop / gate | frozen |
| Resume | `ENGINE_RESUME` | world loop | running |
| Snapshot | `ENGINE_SNAPSHOT` | `runtimeSnapshot` / frame | disk / SSOT |
| Perf / debug | `ENGINE_PERF_MODE` | profiling flags | metrics |

### D) Memory / identity zone

| UI (soyut) | Intent | Engine action (hedef) | Output |
|------------|--------|------------------------|--------|
| Sync | `MEMORY_SYNC` | continuity / identity flush | storage |
| Reset continuity | `MEMORY_RESET` | continuity clear policy | fresh slice |
| Persist | `MEMORY_PERSIST` | explicit persist | durable |

### E) Observability zone

| UI (soyut) | Intent | Engine action (hedef) |
|------------|--------|------------------------|
| Log toggle | `OBS_LOG_TOGGLE` | logger flags |
| Trace panel | `OBS_TRACE_VIEW` | UI route / panel |
| Export | `OBS_EXPORT` | dump / download |

---

## 3. Command grammar — dört seviye

### Level 1 — Raw (insan / ses / metin)

Örnek: `gateway retry`, `world split`, `pause engine`.

### Level 2 — Rhizoh command (structured)

```json
{
  "intent": "GATEWAY_RETRY",
  "source": "button | voice | script",
  "context": { "gatewayPhase": "uncertain" },
  "correlationId": "…"
}
```

### Level 3 — Engine command (çalışan API)

Örnek: `gatewayUx.retry({ correlationId })`, health tick zinciri, `uiStore.dispatch(…)` — **kod gerçeği burada**.

### Level 4 — System response (gözlemlenebilir)

- Konsol: `[RHIZOH_*]`, `[CASTLE_BOOT]`, faz geçişleri
- CustomEvent: `castle:rhizoh-signal` (`detail.name`, `detail.correlationId`)
- Bellek: `localStorage` / continuity / runtime snapshot (ilgili akışa göre)

---

## 4. “Rhizoh brain” (kontrol yüzeyinden bağımsız)

**Tanım (V0):** UI dışı tetikleyiciler (zamanlayıcı, gateway cevabı, ağ durumu, iç orkestrasyon) aynı **intent graph** düğümlerine bağlanabilir; UI yalnızca bir **kaynak**.

Kaynak örnekleri: `button`, `voice`, `script`, `auto_poll`, `reconnect_scheduler`.

---

## 5. Castle + media (hedef komut sözlüğü — envanter)

Bu bölüm **isim standardı** içindir; fonksiyon eşlemesi ürün envanteri çıkarılırken doldurulur.

| Domain | Intent (örnek) | Not |
|--------|----------------|-----|
| Castle | `CASTLE_CREATE`, `CASTLE_OPEN`, `CASTLE_LINK`, `CASTLE_REMOVE` | sahnede node / kale yaşam döngüsü |
| Media | `MEDIA_OPEN`, `MEDIA_PLAY`, `MEDIA_PAUSE`, `MEDIA_BIND_CASTLE` | oynatıcı + graph bağları |

---

## 6. Cursor work plan (UI’a dokunmadan X-ray)

### Step 1 — Button inventory

- Rhizoh / Castle shell içinde `button` + kritik `role="button"` listesi (DOM + yakın üst başlık / `aria-label`).
- Çıktı: tablo — `selector_hint`, `visible_label`, `panel_region` (tahmini).

### Step 2 — Intent annotation

- Her satır için: `intent` (tablodaki sözlükten), `primary_engine_hook` (dosya + fonksiyon), `state_outputs`.

### Step 3 — Domain grouping

- A–E bölgelerine haritalama; çakışan intent’ler için tek kaynak “canonical intent” seçimi.

### Step 4 — Command grammar mapping

- Ses / metin komutları (varsa) → Level 2 JSON → Level 3 çağrı; UI ile **aynı intent** altında birleştirme.

---

## 7. Kısa sonuç

- **UI zaten bir control surface**; atlas **anlam haritası** ekler.
- **Health / temporal inference** katmanı güçlendi; bu dosya **ürün dilini** ona paralel tutar.
- Sonraki somut iş: Step 1–2 envanterini repo kökünde veya `docs/academic/` altında tablo olarak büyütmek (yine `RESEARCH-ONLY` önerilir).
