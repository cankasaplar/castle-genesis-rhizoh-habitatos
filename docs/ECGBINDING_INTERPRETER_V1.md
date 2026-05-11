# ECGBinding Interpreter (ECGI-1)

**Durum:** Canonical spec + **salt okunur** referans implementasyon: `scripts/ecgBindingInterpreter.mjs`.  
**Sürüm:** ECGI-1  
**İlişkili:** [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) · [`AEE_RUNTIME_STATE_MACHINE_V1.md`](AEE_RUNTIME_STATE_MACHINE_V1.md) · [`APPLY_SEMANTICS_ENGINE_V1.md`](APPLY_SEMANTICS_ENGINE_V1.md)

---

## 1. Amaç

**ECGBinding Interpreter**, `ecgBinding` (ve isteğe bağlı bağlam) girdisini **yorumlayan** hafif motordur:

- **Read-only reasoning trace** üretir — yani “bu kayıt, şu **tanık** kimlikleriyle **aynı oturumda** ilişkilendirildi” diyebilir.
- **ECG’ye yazmaz**, **TAL’dan nedensellik türetmez**, **CIL’i değiştirmez**.
- [`ETSS-1`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md) **non-collapse** ve **witness-only** çizgisini kod seviyesinde tekrarlar.

Bu, “reasoning trace engine”dir; **karar motoru** veya **validator** değildir ([`ECV` planı](EPISTEMIC_PHASE2_EXECUTION_VALIDATION_V1.md) ayrı).

---

## 2. Girdi şeması (`EcgBinding`)

```json
{
  "causalNodeId": "cn:optional:studio-atom",
  "epochRef": "0x… veya anayasal epoch kimliği"
}
```

- En az biri dolu olabilir; ikisi de boş = **boş bağlama** (geçerli).
- Ek alanlar **yok sayılır** (ileri sürümlerde `ECGI-2` ile genişletilebilir).

---

## 3. Çıktı şeması (`InterpretationReport`)

```json
{
  "ecgiVersion": "1.0",
  "role": "READ_ONLY_WITNESS",
  "binding": { "causalNodeId": "…", "epochRef": "…" },
  "trace": [
    {
      "kind": "witness_link",
      "meaning": "AEE finding or human note may reference this ECG/epoch id for audit correlation only."
    }
  ],
  "forbidden": [
    "Do not treat ecgBinding as proof of causal derivation from SESSION_LOG.",
    "Do not mutate causal graph from interpreter output.",
    "Do not elevate witness link to canonical truth without CIL + attested artifact path."
  ],
  "empty": false
}
```

---

## 4. Yorumlama kuralları

| Kural | Açıklama |
|--------|----------|
| **Witness-only** | `causalNodeId` / `epochRef` yalnızca **korelasyon** içindir. |
| **No inference** | Interpreter, “bu yüzden verify fail oldu” **sonucunu üretmez**; bunu ancak insan veya ayrı ECV politikası bağlar. |
| **Deterministik** | Aynı girdi → aynı `InterpretationReport` (JSON canonical sıra). |
| **Saf fonksiyon** | I/O yok; CLI sarıcıdır. |

---

## 5. AEE entegrasyonu

- `validateCilAmendment.mjs --json` çıktısındaki `findings[].ecgBinding` alanları bu şemaya uygun olmalıdır.
- Ortam değişkeni `AEE_ECG_REF_JSON` ile tüm finding’lere aynı tanık eklenir — **toplantı / replay oturumu** gibi operasyonel bağlam için.

---

## 6. CLI

```bash
node scripts/ecgBindingInterpreter.mjs --file scripts/fixtures/ecgi-sample-binding.json
# veya POSIX: --json '{"causalNodeId":"cn:example"}'
# veya: ECGI_INPUT_JSON='{"epochRef":"0xabc"}' node scripts/ecgBindingInterpreter.mjs
npm run epistemic:ecg-binding-interpret -- --file scripts/fixtures/ecgi-sample-binding.json
```

---

*ECGI-1 — Read-only ECGBinding interpretation; no graph writes, no truth elevation.*
