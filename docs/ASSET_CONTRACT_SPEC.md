# 3D asset kontratı — semantic-first (Rhizoh / robotics / habitat)

**SPECFLOW:** `FUTURE-PROOF-ONLY` veya `RESEARCH-ONLY` — **frozen core (v562–v570) koduna doğrudan bağlayıcı değildir**; ileride üst katman veya v571+ implementasyon için **sözleşme taslağıdır**.

**Amaç:** Asset **üretmeden önce** türleri, etkileşim kuralları ve anlamsal sabitleri tanımlamak; böylece procedural / AI-generated pipeline’a geçişte **kontrat stabil** kalır.

İlgili: [`SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md`](SPRINT_PREP_ACADEMIC_ROBOTICS_FROZEN_CORE.md), [`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md).

### Mimari zincir (üç katman — gerçek repo karşılığı)

| Katman | Belge / hakem | Soru |
|--------|----------------|------|
| **1 — Spec** | Bu dosya (`ASSET_CONTRACT_SPEC`) | Ne tür projection kabul edilir? CORE vs RESEARCH sınırı nerede? |
| **2 — Mapping** | [`ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md) | Kontrat dünyada **neye** dönüşür? `WorldState` / hook / perception encoding |
| **3 — Execution** | Frozen core **v562–v570** + DAG/hash CI ([`ARCHITECTURE_POST_FREEZE_SUMMARY.md`](ARCHITECTURE_POST_FREEZE_SUMMARY.md)) | Gerçekte **ne çalışır**? |

**Kanonik cümle (İngilizce):** *Assets are not entities in the system; they are projections of a constrained world-state mapping layer.*

**Türkçe:** Varlıklar sistemde “mesh dosyası” olarak durmaz; **kısıtlı dünya-durumu eşleme katmanının projection kuralıdır**. 3D, **input / gerçeklik kaynağı değil**, isteğe bağlı **perceptual projection endpoint**’idir.

**Tehlikeli sınır:** Mapping/spec katmanının frozen çekirdeğe **import veya davranış sızdırması** — repoda koruma: çekirdek **ileri yönlü DAG**, mapping dokümanları çekirdek modül **import etmez**; graf doğrulayıcı CI’da.

---

## 1. Sprint karar matrisi (3D’nin rolü)

| Sprint çizgisi | 3D asset zorunlu mu? | Odak |
|----------------|---------------------|------|
| **Academic** | Hayır | invariant listesi, formal reasoning, spec / paper — görsel **opsiyonel temsil** |
| **Robotics / digital twin** | Kısmen (çoğu zaman **minimal veya placeholder mesh**) | Ortam temsili, sensör/simülasyon, nesne–etkileşim **haritası** — kalite değil **semantic model** |
| **Habitat / presence / live (Rhizoh)** | Çok değerli (ürün hissi) | Perceptual rhythm, presence loop, viewer feedback, yayın katmanı — 3D yüzey **epistemik geri bildirim taşıyıcısı** olabilir |

---

## 2. İki rol ayrımı (mimari ile uyumlu)

| Rol | Anlam |
|-----|--------|
| **Visual layer** | UI / temsil / estetik |
| **Semantic anchor** | Sistemde “gerçeklik hissi” ve **ölçülebilir etkileşim anlamı** — frozen çekirdekteki gözlem–güven zinciriyle **ileride** eşlenecek **aday sinyaller** (bu belge yalnızca isimlendirir). |

Rhizoh çizgisinde **ikincisi** önceliklidir: asset, önce **ne anlama geldiği** ile tanımlanır.

---

## 3. Kontrat boyutları (doldurulacak şema)

### 3.1 Nesne türleri (`AssetKind`)

| `kind_id` | Açıklama | Örnek |
|-----------|----------|--------|
| *(placeholder)* | | avatar, prop, terrain_chunk, vessel_proxy, hud_glyph |

Her `kind_id` için:

- **Sim içi kimlik:** stable string / enum (ULID görsel örneğe bağlanabilir; kontrat katmanında enum yeterli olabilir).
- **Default interaction class:** `none` \| `pick` \| `proximity` \| `broadcast_sink` \| *(genişletilir)*

### 3.2 Etkileşim kuralları (`InteractionRule`)

- Tetikleyici: mesafe, zaman penceresi, kullanıcı eylemi, telemetri olayı.
- Yan etki (ürün): presence emit, seal öncesi log, **rate limit** — implementation ayrı sprint.
- **Frozen core eşlemesi (konseptsel, kod değil):**
  - “ani sıçrama / jitter” → ileride gözlem gürültüsü → **trust / coupling** ile tartışılabilir (v568–v567 düşüncesel paralel).
  - “sık flip / tutarsız kullanıcı geri bildirimi” → **drift / semantics** tartışması (v569–v570 düşüncesel paralel).

Bu eşleme **tasarım notudur**; sayıların çekirdeğe bağlanması ayrı iş paketi ve **CORE-ELIGIBLE** değerlendirmesi gerektirir.

### 3.3 Semantik etiketler (`SemanticTag`)

Üretimden bağımsız, kontrat düzeyinde etiketler:

- `epistemic.surface` — kullanıcıya mühür / durum gösteren yüzey  
- `presence.linked` — presence mesh ile ilişkili  
- `live.feed.reflects` — harici yayın / IoT ile zayıf bağlantılı  

### 3.4 Asset arabirimi (teknik minimum)

| Alan | Açıklama |
|------|-----------|
| `contract_version` | Bu spec sürümü (örn. `asset-contract-v0`) |
| `geometry_ref` | Dosya yolu veya procedural generator id |
| `bounds` | Rough AABB veya LOD stub |
| `material_profile` | PBR vs unlit vs debug — **semantic öncelik** hangisi |
| `telemetry_slots[]` | Hangi runtime olayları üretebilir (isim + şema stub) |

---

## 4. Aşamalı strateji (önerilen)

1. **Şimdi:** Asset üretme yok; yalnız bu kontrat + örnek enum/satır doldurma.  
2. **Robotics veya habitat sprint:** Minimal asset set + **aynı kontrat id’leri**.  
3. **Sonra:** Procedural / AI-generated pipeline — çıktı **kontrata doğrulanır**, tersine değil.

---

## 5. Açık konular

- [ ] `AssetKind` ilk küme — ürün ekibi ile kesinleştirilir.  
- [ ] Cesium / Three / WebGPU hangi yol için **canonical** — robotics vs client ayrımı.  
- [ ] Kişisel veri / yayın içeriği — asset kontratına **PII yok** ilkesi.

---

## Eşleme (ileri katman)

Semantic kontrattan **dünya modeli ve gözlem akışına** tasarım köprüsü: [`ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md).

---

*Bu belge “asset üretmeden önce sistemi tanımlayan” seviyededir; implementasyon frozen core’u değiştirmeden üst katmanlarda yapılır.*
