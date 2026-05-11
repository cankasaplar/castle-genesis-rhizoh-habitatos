# Rhizoh — FER-1 Minimal Production Stack (V1)

**Rol:** Yeni spec üretmek yerine **runtime assembly** — “anlam üreten” katmanlar zaten var; eksik olan **anlamı zaman içinde taşıyan motor** (event → güvenli yazım → indeks → replay / canlı). Bu belge **FER-1 §13** üç parçasının **dosya ve repo karşılığıdır**.

**Eşik (ürün):** FER-1 **uygulanmadan** Rhizoh bir **sistem** kalır; bu stack **çalıştırıldığında** canlı epistemic runtime’a doğru ilk adım atılır.

**Normatif üst belgeler:** [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) · [Firestore Rules intent](FIRESTORE_RULES_INTENT_FER1_V1.md) · [Implementation Map](RHIZOH_IMPLEMENTATION_MAP.md) · **[Runtime closure patch](RHIZOH_FER1_RUNTIME_CLOSURE_PATCH_V1.md)** (gateway validate, ordering, OWIS bridge, broadcast, replay) · **[Production closure blueprint](RHIZOH_FER1_PRODUCTION_CLOSURE_BLUEPRINT_V1.md)** (RDCL: determinizm + dünya üretimi) · **[RDCL implementation map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md)** (kablo planı) · **[WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)** (kısmi arıza / tutarlılık) · **[SR-1](RHIZOH_SEMANTIC_RECOVERY_V1.md)** (semantic recovery UX) · **[TMC-1](RHIZOH_TRUST_MEMORY_CONSISTENCY_V1.md)** · **[ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)** · **[ECR execution model](RHIZOH_ECR_EXECUTION_MODEL_V1.md)** · **[AIL-1](RHIZOH_AGENCY_INTENT_SHAPING_V1.md)** (agency) · **[GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md)** (PAG/HOGA) · **[EAERT](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)** (icra denkliği)

**Durum:** `NORMATIVE_TARGET` — parçalar kademeli deploy.

---

## 1. Mimari gerçek (durum)

| Katman | Durum |
|--------|--------|
| **Cognitive OS** (TCS / OWIS / ESTL / UI) | **Complete** (belge + ürün dili) |
| **Epistemic OS** (modeller, FREEZE, FER sözleşmesi) | **Complete** |
| **Runtime OS** (Firebase causality + rules + router + broadcast) | **Incomplete** → bu stack |

**Karar anı:** (A) yeni spec → soyutlama artar · (B) **FER-1 sprint** → canlıya çıkış — bu belge **(B)**.

---

## 2. Üç parça → repo karşılığı

| Parça | Ne | Repo konumu |
|-------|-----|----------------|
| **1 — Schema layer** | JSON Schema + type manifest | `docs/schemas/firebase/` |
| **2 — Firestore Rules v1** | Deploy-ready güvenlik + companion / observe / ESTL | Kök [`firestore.rules`](../firestore.rules) (FER-1 blokları eklendi) |
| **3 — Sync / broadcast engine** | TCS↔OWIS köprü iskeleti + broadcast worker + (opsiyonel) Cloud Function | `apps/gateway/src/fer1/*`, `functions/` |

---

## 3. `/events` — Firestore şeması (minimal)

**Yol:** `rhizoh_events/{stream}/items/{eventId}`  
**stream ∈** `companion | observe | chronicle | castle | studio`  
**Yazma:** append-only create (update/delete kapalı).  
**Zorunlu alanlar:** `type`, `source`, `schemaVersion`, `correlationId`, `actorUid` (`actorUid == request.auth.uid` for `source: client`).

Manifest ve envelope şema: [rhizoh_event_types.json](../schemas/firebase/rhizoh_event_types.json), [rhizoh_event_envelope.schema.json](../schemas/firebase/rhizoh_event_envelope.schema.json).  
Örnek payload: [companion_message_sent_v1.schema.json](../schemas/firebase/payloads/companion_message_sent_v1.schema.json).

**Gateway’de validate:** `schemaVersion == 1` ve `type` manifest ile eşleşmeli (henüz kod bağlanmadı — sıradaki PR).

---

## 4. TCS → Firebase → OWIS köprüsü

İskelet: [`apps/gateway/src/fer1/tcsOwisBridgeSkeleton.js`](../apps/gateway/src/fer1/tcsOwisBridgeSkeleton.js) — `correlationId` üretimi ve observe event stub.

---

## 5. Broadcast worker

İskelet: [`apps/gateway/src/fer1/broadcastWorkerSkeleton.js`](../apps/gateway/src/fer1/broadcastWorkerSkeleton.js) — `broadcast_index` için yer tutucu.

---

## 6. Cloud Function event router

- [`functions/index.js`](../functions/index.js) — `onDocumentCreated` ile `rhizoh_events/{stream}/items/{eventId}` loglama (projection/replay sonraki adım).  
- [`functions/README.md`](../functions/README.md) — `firebase.json`’a `functions` eklenmesi ve `npm install`.

---

## 7. Zaman çizelgesi (motor)

**Sorun:** Event’ler var ama sistem onları **tek güvenilir zaman çizelgesine** dönüştürmüyordu.  
**Çözüm yönü:** Function veya gateway **projection** koleksiyonu (`rhizoh_timeline/{uid}/chunks/...`) — henüz yok; router + rules bu motorun **ilk yarısıdır**.

---

## 8. Sonraki sıra (çalışan canlı sistem)

1. İstemciden `rhizoh_events/.../items` append + `rhizoh_client_sync` yaz (kurallar şu an izin veriyor).  
2. Gateway’de Ajv veya el ile envelope + `rhizoh_event_types.json` doğrulaması.  
3. `firebase deploy --only firestore:rules`  
4. Functions deploy (isteğe bağlı) → projection tablosu.  
5. Broadcast index + YouTube köprüsü.

---

## 9. İlişkili belgeler

- [FER-1](RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md)  
- [Schema pack README](schemas/firebase/README.md)  

---

*FER-1 Minimal Production Stack V1 — runtime assembly; motor; ürün eşiği.*
