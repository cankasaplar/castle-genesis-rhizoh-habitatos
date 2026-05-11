# WorldState v0 — canonical snapshot / replay / diff / epistemic envelope

**SPECFLOW:** `RESEARCH-ONLY` \| `FUTURE-PROOF-ONLY` — **laboratory universe** katmanı; frozen execution motorunun yerini **tutmaz**.

**JSON Schema:** [`schemas/worldstate-v0.schema.json`](schemas/worldstate-v0.schema.json)

**Attribution:** [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md) — attribution **forensic metadata**dır; **semantic authority değildir** (aşağı §6).

---

## 1. Mimari konum (senin çerçeven)

| Kavram | Karşılık |
|--------|----------|
| **Frozen causal kernel** | v562–v570 kod + DAG |
| **Expanding observational manifold** | Observation Fabric + mapping + bu snapshot |
| **Karar üretmek** | **Değil** — “kararın nasıl **modellenebileceği**” ve gözlem ekolojisi |
| **Multi-agent** | Çok **bakış açısı**, çok **karar otoritesi** değil |

---

## 2. WorldState v0 ne içindir?

- **Anlık evren snapshot’ı** (engineering): replay, state diff, zaman serisi karşılaştırma.
- **Epistemik snapshotting** alanı: `epistemic_snapshot.labels` — lab notları; frozen faz ile **otomatik bağ** iddiası **yok**.

---

## 3. Replay engine contract (mantıksal)

| Kural | Açıklama |
|-------|-----------|
| **Frame sırası** | `logical_tick` monoton artan; replay bu sırayı takip eder |
| **Determinizm** | Snapshot içeriği aynı girişlerle yeniden yazılabilir olmalı; rastgele kaynak varsa `provenance` + seed ayrı belgede |
| **Execution izolasyonu** | Replay **motor durumu overwrite etmez** — yalnızca gözlem/manifold kaydı |
| **Core ref** | `frozen_core_refs` isteğe bağlı; dokümantasyon amaçlı |

Gerçek replay motoru implementasyonu — ayrı sprint (`experimental/` veya servis).

---

## 4. Diff semantics (v0)

İki `WorldState` **A**, **B** için (aynı `world_id` önerilir):

| Diff türü | Anlam |
|-----------|--------|
| `entity_added` / `entity_removed` | `entity_id` |
| `entity_kind_changed` | `kind_id` farkı |
| `semantic_tags_delta` | küme farkı |
| `observation_digest_delta` | stream hash farkı |
| `epistemic_labels_delta` | sayısal etiket farkı (yorum alanı) |

Çıktı formatı: JSON Patch benzeri veya küçük özel diff nesnesi — implementasyon serbest.

---

## 5. Epistemic snapshot formatı

`epistemic_snapshot`:

- `labels`: serbest anahtar → [0,1] skaler — **örnek hipotez uzayı** için.
- `schema_note`: **zorunlu**: “Bu değerler frozen v567–v570 ile kod bağlantılı değildir” gibi insan-readable uyarı.

İleri faz: etiketleri gözlem boru hattına bağlamak **bilinçli mimari karar** + muhtemelen v571+.

---

## 6. Attribution riski (pseudo-authority)

Büyüdükçe risk: attribution **yorum otoritesi** gibi algılanır.

**Koruma:**

- `provenance.forensic_only: true` şema uyarısı (implementation opsiyonel).
- Politika: **attribution = forensic metadata**, **asla** tek başına “doğru anlam” kaynağı değil.
- Karar hâlâ: insan merge + frozen kod.

---

## 7. Önerilen sıralama (stabil research OS)

1. **WorldState v0** (bu belge + şema) — gözlemlenebilirlik  
2. **Diff / replay** araçları — mühendislik  
3. **Academic invariant pack** — “neden bozulmaz?” formal katmanı  

*Önce sistemi gözlemlenebilir yap; sonra kanunlaştır.*

---

## 8. İlgili

- [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)  
- [`EPISODIC_QUERY_RECONSTRUCTION_V1.md`](EPISODIC_QUERY_RECONSTRUCTION_V1.md) — çok katmanlı deterministik rehydration planı  
- [`ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md)  
- [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md)  

---

*Frozen Causal Kernel + Expanding Observational Manifold — manifold burada **snapshot** ile temsil edilir; kernel **genişlemez**.*
