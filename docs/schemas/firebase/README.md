# Firebase event schemas (FER-1)

**Rol:** [FER-1](../../RHIZOH_FIREBASE_EPISTEMIC_RUNTIME_SPEC_FER1.md) **event_type** tanımları ve payload sözleşmeleri burada toplanır — şu an **henüz dosya yok** (implementation sprint parça 1).

**Dosyalar (V1 minimal):**

| Dosya | İçerik |
|-------|--------|
| [`rhizoh_event_types.json`](rhizoh_event_types.json) | Stream başına izinli `type` listesi |
| [`rhizoh_event_envelope.schema.json`](rhizoh_event_envelope.schema.json) | Zorunlu üst alanlar |
| [`payloads/companion_message_sent_v1.schema.json`](payloads/companion_message_sent_v1.schema.json) | Örnek payload |

**Doğrulama:** Gateway veya Cloud Function’da envelope + manifest; `schemaVersion` reddi.

**Üretim stack:** [FER-1 Minimal Production Stack](../RHIZOH_FER1_MINIMAL_PRODUCTION_STACK_V1.md)
