# Asset contract v1 → world model mapping

**SPECFLOW:** `RESEARCH-ONLY` \| `FUTURE-PROOF-ONLY` — **tasarım notu**. Frozen çekirdek (`v562–v570`) dosyalarını **değiştirmez**; ileride üst katman / v571+ için **compiler-benzeri** eşleme taslağıdır.

İlgili: [`ASSET_CONTRACT_SPEC.md`](ASSET_CONTRACT_SPEC.md), [`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md).

**Konumsallaştırma:** Freeze sonrası kritik olan önce **constraint consistency**; temsil (3D) **projection**. Academic sprint için 3D **zorunlu değildir**.

Bu dosya zincirde **katman 2 (mapping)**dır; katman 1 [`ASSET_CONTRACT_SPEC.md`](ASSET_CONTRACT_SPEC.md), katman 3 frozen **v562–v570** execution ([`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md)).

**Kanonik cümle:** *Assets are not entities in the system; they are projections of a constrained world-state mapping layer.*

**Paradigma özeti:** Asset-driven / representation-first değil — **constraint-driven**, inference-first, epistemik gerçeklik öncelikli; görsel yalnızca projection uçları.

---

## 1. Üç sprint yüzeyi — özüt

| Katman | Gerçek rol | 3D / görsel |
|--------|------------|-------------|
| **Academic** | inference / formal reasoning | Yok veya sunum artefactı |
| **Robotics** | world model / kısıt simülasyonu | Projection; asıl nesne **semantic state + interaction graph** |
| **Habitat (Rhizoh / live)** | algı / geri bildirim döngüsü | Opsiyonel **epistemik feedback surface** (attention, kullanıcı algısı) |

---

## 2. Semantic asset → world state (mantıksal mapping)

`AssetContract` (bkz. `ASSET_CONTRACT_SPEC`) nesneleri, çalışma zamanında **WorldState** alt yapılarına düşer. Bu tablo **alan adları taslağıdır** — implementasyon yok.

| Kontrat alanı | Dünya modeli hedefi | Not |
|---------------|---------------------|-----|
| `kind_id` | `entity.class` | Sim içi rol |
| `interaction_rule_ref` | `entity.admissible_actions[]` / graf kenarı | Kısıt simülasyonu girişi |
| `semantic_tags[]` | `telemetry.policy_hints[]` | Hangi olayların yükseltileceği |
| `geometry_ref` / bounds | `collision.proxy` \| `lod.visual_only` | Fizik **zorunlu değil** — robotics için stub olabilir |
| `telemetry_slots[]` | `observation.streams[id]` | Aşağıdaki §5 ile bağlantı |

**İlke:** Önce **state + graph**, sonra mesh/shader.

---

## 3. Robotics / digital twin — simulation hook points

| Hook id | Beslenen | Üretilen (taslak) |
|---------|-----------|-------------------|
| `SIM.tick.beforePhysics` | `WorldState.forces`, constraints | güncellenmiş kinematik özet |
| `SIM.sensor.sample` | harici truth / synthetic noise profili | `observation.streams[sensor]` |
| `SIM.asset.resolve` | `kind_id` + kontrat sürümü | semantic entity binding |

Burada **3D**, sensör modelinden çıkan **iz düşümü** (projection); gerçeklik kaynağı `WorldState` + kurallar.

---

## 4. Habitat / perception encoding

| Kodlayıcı (taslak) | Anlam | Örnek sinyal |
|--------------------|--------|----------------|
| `PERCEPT.visibility` | görünürlük / dikkat alanı | kamera frustum, UI odak |
| `PERCEPT.rhythm` | perceptual rhythm / burst | yayın segmenti, event mesh |
| `PERCEPT.presence` | çoklu kullanıcı / ajan yakınlığı | presence loop yoğunluğu |

Çıktı: yapılandırılmış **viewer-facing summary** — mümkünse seal/trace için uygun düşük boyutlu özüt (implementation ayrı).

---

## 5. v567–v570 ile “observed state” — **konseptual paralel**

Bu bölüm **isim eşlemesi**dır; frozen faz koduna bağlantı **otomatik değildir**.

| Frozen iç düşünce (concept) | Dış dünya / asset dünyasında **aday observed bundle** |
|-------------------------------|--------------------------------------------------------|
| Triaksiyel gözlem readout (v566) | Birleştirilmiş stabilite skalerleri üreten **upstream özütü** (örn. çoklu `telemetry_slots` → tek `budget01_candidate`) |
| Trust calibration (v568) | Gözlenen akışların tutarlılığı / volatilite özeti → **trust_hint_candidate** |
| Temporal coupling (v567) | `observation.streams` üzerinde yumuşatma + histerezis **öncesi** ham ↔ smoothed ayrımı |
| Trust drift (v569) | Aynı entity için zaman içi flip/churn sayımına uygun **event ledger stub** |
| Error semantics (v570) | `skipped` / gap / flip_pressure benzeri **sınıflandırma girdileri** (taslak alanlar) |

**Uyarı:** Bu tabloyu “implementasyon yapıldı” sanmak epistemik hatadır. Doğru kullanım: **robotics/habitat sprintte** hangi ölçümlerin toplanacağını seçmek; çekirdeğe bağlam **bilinçli mimari karar + muhtemelen v571+ veya üst servis**.

---

## 6. Sonraki adımlar (checklist)

- [ ] `WorldState` şema v0 JSON/tür taslağı (repo içi veya `experimental/`).  
- [ ] `kind_id` ilk kümesi — ürün + robotics ortak.  
- [ ] Habitat için minimum `PERCEPT.*` → özüm çıktısı örneği (fixture).  

---

*Bu belge “reality model compiler” yönünde bir ara katmandır; asset üreticisi değildir.*
