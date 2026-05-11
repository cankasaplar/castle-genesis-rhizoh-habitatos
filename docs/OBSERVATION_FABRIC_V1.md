# Observation Fabric v1 — multi-observer, execution-isolated

**SPECFLOW:** `RESEARCH-ONLY` \| `FUTURE-PROOF-ONLY` — **policy / design**. Frozen execution core (**v562–v570** DAG) **değiştirilmez**; bu belge üst katman genişlemesi için sözleşmedir.

**Attribution / mühür:** [`AGENT_IDENTITY_AND_ATTRIBUTION.md`](AGENT_IDENTITY_AND_ATTRIBUTION.md)

---

## 1. Tek kural (execution isolation)

> **Agents may influence interpretation, never execution.**

**İkinci invariant (aggregation / çıkarım):**

> **Observation may be aggregated. Execution may never be inferred.**

Yani: gözlemler birleştirilebilir; bunlardan **execution kararı çıkarımı** yapılmaz — aksi **observation → decision leakage** hatasıdır.

- **Execution authority** yalnızca **frozen DAG + onaylı kod yolu** (CI ile doğrulanan import grafiği).
- **Observers** (Nisa, Cursor Agent, harici LLM, insan, canlı feed) yalnızca **gözlem akışı** ve **yorum** üretir; çekirdek durum geçişini **doğrudan** komuta etmezler.

Bu yüzden yapı **“birbirine karışan zihinler”** değil, **izole gözlemciler** (observers) + **tek deterministik motor**.

---

## 2. Katman yerleşimi (özet)

| Katman | Rol | Örnek |
|--------|-----|--------|
| **Observation Fabric** | Çoklu gözlem kaynağı + şema | Bu belge |
| **Epistemic stack (frozen)** | Trust / drift / semantics **motoru** | v567–v570 (kod) |
| **Execution core (frozen)** | Nedensellik + state transition kuralları | v562–v570 DAG |
| **Mapping / asset (spec)** | Projection kuralları | `ASSET_CONTRACT_*` |

**Zeka birleşmez — gözlemler birleşir** (fusion = epistemik işleme katmanında, execution’a sızmadan).

---

## 3. Agent rolleri (kim execution değildir)

| Rol | Görev | Execution? |
|-----|--------|-------------|
| **Human (orchestrator)** | Karar, merge, freeze ihlali veto | İnsan onayı olmadan kod merge yok |
| **Nisa (ChatGPT vb.)** | Fikir, formal tasarım, birlikte düşünme | Hayır |
| **Cursor Agent** | Repo diff önerisi, test, doc — kurallara bağlı | Hayır — öneri; merge insan/CI |
| **External LLM** | Harici inceleme, özet | Hayır |
| **Live data / broadcast** | **Observation stream** | Hayır — **input gating** ile beslenir |
| **Keys / tokens** | **Access / rate limit** | Hayır — “ajan gücü” değil |

---

## 4. Observation schema (taslak alanlar)

Tüm gözlemler **append-only veya sürümlü kayıt** düşünülerek tasarlanır (implementation ayrı).

```text
ObservationRecord {
  observation_id: string        // ULID veya benzeri
  source_kind: "human" | "nisa_session" | "cursor_agent" | "external_llm" | "live_feed" | "sensor_sim"
  source_ref: string              // oturum id, PR, feed adı (PII yok)
  recorded_at: string           // ISO-8601
  topic: string                  // serbest veya enum
  payload_ref: string            // harici blob veya inline özüt (küçük)
  confidence_hint_01: number     // 0..1 — öneri; frozen trust ile karıştırma
  specflow_tag: "RESEARCH-ONLY" | ...
}
```

**Trust weighting (bağlamsal, kod değil):** `confidence_hint_01` ile frozen **v568–v569** mantığı **aynı değildir**; ileride üst servis bu kayıtları **triaksiyel readout öncesi** birleştirebilir — tasarım notu, otomatik bağlantı iddiası yok.

---

## 5. Live data ingestion contract (taslak)

| İlkeler | Açıklama |
|---------|-----------|
| **Stream = observation** | Karar otoritesi değil |
| **Keys = gating** | Erişim ve kota; execution branch seçimi değil |
| **Broadcast = telemetry feed** | İzleyici / seal için özüt; doğrudan policy overwrite yok |
| **Rate limit + sandbox** | Üretim öncesi staging |

---

## 6. İsimlendirme (isteğe bağlı)

- **Symbiotic Observational Field with Frozen Deterministic Core** — üst düzey tanım.
- Alternatif teknik etiket: **Multi-Observer Weighted Interpretation System (MOWIS)** — *weighted interpretation*, ortak execution intelligence değil.

---

## 7. İlgili belgeler

- [`CONTEXT_RECONSTRUCTION_PROMPT.md`](CONTEXT_RECONSTRUCTION_PROMPT.md) — bağlam yeniden kurulum  
- [`ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md`](ASSET_CONTRACT_V1_TO_WORLD_MODEL_MAPPING.md) — projection  
- [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md) — yeni katman kuralları  
- [`WELCOME_RHIZOH.md`](WELCOME_RHIZOH.md) — ilk temas epistemik metin (UI ile senkron)
- [`FIRST_TOUCH_PROTOCOL.md`](FIRST_TOUCH_PROTOCOL.md) — first-touch / returning / versioning sözleşmesi
- [`BOOT_ARTIFACT_PROTOCOL.md`](BOOT_ARTIFACT_PROTOCOL.md) — Attested Boot Observation Artifact v1 (boot’ta ilk sealed gözlem; provenance ≠ semantics)
- [`OBSERVATION_EVENT_REGISTRY.md`](OBSERVATION_EVENT_REGISTRY.md) — gözlem olayı taksonomisi (boot = #1)
- [`ARTIFACT_FAMILY_TAXONOMY.md`](ARTIFACT_FAMILY_TAXONOMY.md) — ABOA / ASAA / AFOA / AOJA / APEA wire taslakları
- [`EXTERNAL_OBSERVER_REGISTRY.md`](EXTERNAL_OBSERVER_REGISTRY.md) — harici gözlem kaynakları (Google / NotebookLM vb.); **External observers are data sources, not execution authorities**
- [`NOTEBOOKLM_REGISTER.md`](NOTEBOOKLM_REGISTER.md) — Rhizoh codex ↔ NotebookLM kaynak listesi  
- [`MODEL_ECOLOGY.md`](MODEL_ECOLOGY.md) — modelleri “observer species” olarak sınıflama; distributed epistemic contribution, tek egemen model yok
- [`ROBOTICS_EPISTEMIC_FREEZE.md`](ROBOTICS_EPISTEMIC_FREEZE.md) — robotics = execution / projection; truth layer değil; boundary freeze v0.1

---

*Observation Fabric = symbiotic **observation** layer; symbiotic **execution** intelligence değil.*
