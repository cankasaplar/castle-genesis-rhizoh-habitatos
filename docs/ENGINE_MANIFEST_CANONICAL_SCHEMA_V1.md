# Engine Manifest Canonical Schema (EMCS-1)

**Rol:** **Runtime constitution object** — salt **config** değil; **versioned executable constitution** (anayasa sürümleme sistemi). *Ne yapılır* değil, **neye izin verilir** + **hangi semver sınıfında ne kırılır** tanımlanır.  
**Sürüm:** EMCS-1  
**İlişkili:** [`GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md`](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) · [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md) (**EBVM-1**) · [`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) (**GDK-1**) · [`GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md`](GLOBAL_BOOTSTRAP_VERIFICATION_GATES_V1.md) · [`GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md`](GLOBAL_BOOTSTRAP_PREDICATE_ALGEBRA_V1.md) · [`EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md`](EPISTEMIC_TRIPLE_SURFACE_SPEC_V1.md)

---

## 1. İlke: izin verilen değerlendirme

| Bu şema | Bu şema değil |
|---------|----------------|
| **Neye izin var** (gates, cebir, hata uzayı) | İş kuralları / “ne yapılır” playbook |
| **Constraint evaluation constitution** | Inference veya reasoning programı |
| **Compliance yüzeyi** | Hakikat üreticisi |

**Dış dünya okuması (abartısız):** “Rhizoh compliant” ≈ `evaluateBind(manifest, inputs)` **geçer** (`ok: true` + `ValidityBundle`); aksi halde **`CSB_ERR_*`** — *compliance verification runtime*.

### 1.1 Constitution versioning system (EMCS hardening özeti)

§8–§10 birlikte şunu kilitlemiştir: manifest **yürütülebilir, sürümlü anayasa**dır — sistem yalnızca “çalışır” değil, **kontrollü evrim** (`controlled evolution`) ile genişler.

| Bileşen | Anlam |
|---------|--------|
| **EMCS-major** | **Semantic compatibility break** — izin verilen cebir / gate iskelesi değişir |
| **EMCS-minor** | **Backward-compatible extension** — yeni opsiyonel izinler; eski motor–yeni manifest güvenliği politikaya bağlı |
| **EMCS-patch** | **Deterministic, invariant-preserving fix** — aynı zorunlu anlam; harness ile aynı sonuç sınıfı hedefi |

---

## 2. Kanonik örnek (EMCS-1.0.0)

```json
{
  "manifestVersion": "EMCS-1.0.0",
  "frozenCoreHash": "sha256:<<CORE_HASH>>",

  "semantics": {
    "vg": {
      "entryGates": ["G0", "G1", "G2", "G3"],
      "failFast": true
    },
    "pal": {
      "associativity": "normalized-only",
      "identity": "none",
      "projectionOrder": ["Pack", "EWM.project"]
    },
    "csb": {
      "closure": true,
      "singlePrimaryError": true
    }
  },

  "gateMap": {
    "G0": "eoiValidator",
    "G1": "snapshotLockValidator",
    "G2": "reconcileValidator",
    "G3": "semanticConstraintValidator"
  },

  "errorSpace": {
    "CSB_ERR_*": "closed-algebra",
    "primaryOnly": true
  }
}
```

---

## 3. Alan sözlüğü (özet)

| Alan | Anlam |
|------|--------|
| `manifestVersion` | Şema ailesi — `EMCS-1.x.y` (semver; sürüm kuralları §8–§10) |
| `frozenCoreHash` | **Sistem kimliği** — anayasal / çekirdek bağ (CIL / mühür hattı); drift = compliance ihlali |
| `schemaHash` | (Opsiyonel) **Şema kimliği** — JSON Schema / EMCS alan setinin imzası; `schemaId` ile birlikte |
| `semantics.vg` | VG: hangi gate’ler, fail-fast |
| `semantics.pal` | PAL: associativity modu, identity politikası, projection sırası ([`CSB-1` §5–§7](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md)) |
| `semantics.csb` | CSB: closure + tek primary hata ([`CSB-1` §8](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md)) |
| `gateMap` | `G0`…`G3` → **yorumlayıcı** mantık adı (referans: `scripts/evaluateBind.mjs`) |
| `errorSpace` | Çıktı hatalarının `CSB_ERR_*` cebirinde kalması |

### 3.1 Dual identity binding (`schemaHash` · `frozenCoreHash`)

İkili hash birlikte **çift kimlik bağları** kurar:

- **`frozenCoreHash`** → **system identity** (hangi mühürlü çekirdek / hukuk hattı)  
- **`schemaHash`** (+ isteğe bağlı `schemaId`) → **EMCS identity** (hangi izin şeması / alan cebiri)

Birleşince **runtime drift detection** mümkün olur: çalışan süreç / artefakt ikilisinden biri manifest ile örtüşmüyorsa **sessiz uyum** yok — `HASH_DRIFT` / `CSB_ERR_MANIFEST` politikası (§10).

---

## 4. Üçlü + mühendislik karşılığı

| Artefakt | Rol |
|----------|-----|
| **EMCS-1** | **Constitution** — runtime izin sınırı |
| **`evaluateBind`** | **Runtime evaluator** — manifest + girdi → bundle \| hata ([`scripts/evaluateBind.mjs`](../scripts/evaluateBind.mjs)) |
| **CSB execution harness** | **Execution consistency verifier** — determinizm + tanımlı çıkış ([`scripts/csbExecutionHarness.mjs`](../scripts/csbExecutionHarness.mjs)) |

**CLI:** `npm run epistemic:csb-eval` — özet sonuç; `npm run epistemic:csb-vm` — **EBVM** tam trace; `npm run epistemic:csb-vm-replay` — kayıtlı adımlarla **execution consistency**; `node scripts/csbVmInspect.mjs <vm.json> [--step N]`. Harness: `npm run epistemic:csb-harness`.

**Kırılma:** ❌ “system produces truth” → ✅ “system **enforces evaluation consistency** under **constraint algebra**”.

**Net tanım:** **Formal constraint evaluation kernel** — AI / inference engine / genel reasoning sistemi değil.

---

## 5. Yığın (tamamlanmış okuma)

EMCS-1 → constitution · VG → gating · PAL → algebra · CSB → composition kernel · GCR/EQR → temporal · EWM → projection · `evaluateBind` → runtime evaluator · harness → determinism layer.

---

## 6. Gate hata kodları (referans yorumlayıcı)

`evaluateBind` referansı, faz başarısızlığında **tek primary** (G0…G3 hizalı) döner:

| Faz | Kod |
|-----|-----|
| G0 | `CSB_ERR_IDENTITY` |
| G1 | `CSB_ERR_SNAPSHOT_BIND` |
| G2 | `CSB_ERR_CAUSAL_CLOSURE` |
| G3 | `CSB_ERR_SEMANTIC_CONSTRAINT` |

Bunlar [`CSB-1` §8](GLOBAL_COMPOSITIONAL_SEMANTICS_BINDING_V1.md) `CSB_ERR_LEG_*` ailelerine **lift** edilir (`LEG_BOOT` / `LEG_TEMP` / `LEG_RET` / `EWM` eşlemesi implementasyon notunda keskinleşir).

---

## 7. Tek cümlelik mühendislik durumu

CSB-1 engineering path — **completed state** (referans): EngineManifest-driven, gate-validated, compositionally closed, deterministically testable **constraint evaluation runtime**; **EBVM-1** ile **adımlı VM + trace + replay**; **§14** ile **Epistemic OS** (EMCS / CSB / EBVM) kapanışı.

---

## 8. EMCS hardening — şema sürümleme kuralları

Bu bölüm **constitution versioning system**’in teknik çekirdeğidir: §8–§10 = **sürümlü yürütülebilir anayasa** + uyumluluk + geçiş.

`manifestVersion` **semver üçlüsü** ile okunur: `EMCS-<major>.<minor>.<patch>` (ör. `EMCS-1.2.0`).

| Bileşen | İzin verilen değişiklik | Değerlendirici (consumer) davranışı |
|---------|-------------------------|-------------------------------------|
| **patch** | Yeni **opsiyonel** üst düzey veya `semantics.*` alt alanları; yazım / dokümantasyon alanları | Eski motor **yoksayabilir**; aynı **zorunlu** alanlar → **backward compatible** |
| **minor** | Yeni gate **adı** (`gateMap` değeri) veya yeni `semantics` alt bölümü; mevcut gate **anlamı** aynı | Motor **feature flag** veya `minEmcsMinor` ile seçer; zorunlu alan genişlemezse eski manifest çalışır |
| **major** | `entryGates` kümesi, `gateMap` **anahtarları**, `errorSpace` cebiri, `failFast` varsayılanı gibi **anlam kırıcı** değişiklik | Eski manifest **non-compliant**; `CSB_ERR_MANIFEST` veya ayrı **`EMCS_ERR_VERSION_UNSUPPORTED`** |

**Şema kimliği:** İsteğe bağlı `schemaId` (URI) ve `schemaHash` alanları — İleride JSON Schema yayınlandığında **immutability** için.

**Kilitleme:** `frozenCoreHash` değişimi **yeni constitution** ilanıdır; aynı `manifestVersion` ile **hash drift** yasaktır (operasyonel politika).

---

## 9. Geriye dönük uyumluluk (backward compatibility)

**Taahhüt edilen küme (`EMCS-1` major):**

- **Patch** (`1.0.0 → 1.0.1`): Zorunlu alanlar aynı kaldığı sürece aynı `evaluateBind` + harness **aynı sonuç sınıfı** (determinizm regression).  
- **Minor** (`1.0.x → 1.1.0`): Yalnız **opsiyonel** alan / gate **değeri** eklenmişse, **eski motor** yeni manifest’i reddetmemeli (bilinmeyen opsiyonel anahtarlar **ignore**). **Yeni zorunlu** alan = **breaking** — açık migration + sürüm bump.  
- **Major** (`EMCS-1 → EMCS-2`): Uyumluluk **yok**; yeni evaluator veya `CSB_ERR_MANIFEST` / `VERSION_UNSUPPORTED`.  
- **Okuma yönü:** “Eski manifest + yeni motor” patch/minor için hedeflenir; “yeni manifest + eski motor” yalnızca opsiyonel genişleme ile güvenli.

**Çift okuma (dual-read) penceresi:** Dağıtımda kısa süre `N` ve `N+1` manifest’in kabulü — yalnızca **patch/minor**; **major** için dual-read **yasak**, kesici geçiş.

---

## 10. Migration semantics

**Epistemic state transition system:** Durum artık yalnızca “tek seferlik execution” değil; **versioned semantic state machine** — upgrade / downgrade / kilit / drift, anayasal konfigürasyonun **geçerli** olduğu uzayı tanımlar.

| Hareket | Semantik |
|---------|-----------|
| **Upgrade** | `1.0.x → 1.1.y` — migration script **salt okunur** manifest üretir; yeni alanlar doldurulur; `manifestVersion` bump; **imzalı** artefakt (tören katmanı). |
| **Downgrade** | Desteklenmez veya **explicit** “lossy” export (yeni alanlar atılır) — çıktı **daha zayıf** garanti; ayrı `downgradeOf` pointer. |
| **Frozen manifest** | `migrationLocked: true` (opsiyonel alan) — otomatik migration **reddedilir**; yalnız insan/onaylı amendment. |
| **Drift** | Çalışan sistemin `frozenCoreHash`’i manifest’ten farklı → **compliance ihlali**; sessiz düzeltme yok. |

**Hata uzayı:** `CSB_ERR_MANIFEST` altında refine: `VERSION_UNSUPPORTED`, `MIGRATION_REQUIRED`, `HASH_DRIFT`.

### 10.1 Upgrade = state transition function

**Formal okuma:** Upgrade, salt “dosya değişimi” değil; **anayasal durum geçişi**dir:

`T_upgrade : (M₁, Witness_migration) → M₂`

- `M₁`, `M₂` geçerli **EMCS** manifest nesneleri  
- `Witness_migration` — imzalı / tören onaylı tanık (kim, ne zaman, hangi diff)  
- **Önkoşul:** `M₁` **frozen** veya politikaya uygun mutable  
- **Sonkoşul:** `M₂.manifestVersion` semver sınıfı (minor/patch) politikaya uygun; `schemaHash` / `frozenCoreHash` alanları tutarlı  

**Determinizm:** Aynı `(M₁, Witness)` → aynı **kanonik** `M₂` (normal form).

### 10.2 Downgrade: `forbidden` vs `compensated`

| Mod | Semantik |
|-----|----------|
| **`forbidden` (varsayılan)** | `M₂ → M₁` otomatik veya sessiz **yasak**; ihlal `CSB_ERR_MANIFEST` / `DOWNGRADE_FORBIDDEN`. |
| **`compensated` (explicit)** | Yalnız **kayıtlı** dönüşüm: `T_down : (M₂, Witness_down) → M₁'` — çıktı **M₁ değil**; **daha zayıf garanti sınıfı** (`M₁'`). `downgradeOf`, `lossyFields[]`, `compensationWitness` zorunlu. Sessiz “tam geri” **yok**. |

**İlke:** Downgrade **inference** değil; **bilinçli capability düşürme** + tanık.

---

## 11. Sonraki uygulama adımları

- **GDK-1** — **runtime safety kernel**: clock + sanitize + observer; tek timeline; clock consistency ihlali → `GDK_ERR_*` / replay red ([`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) §7, §10).  
- **EBVM ISA v2** — clocked trace + GECS (eşdeğerlik sınıfı) — [`EVALUATE_BIND_VIRTUAL_MACHINE_V1.md`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md).  
- **JSON Schema** yayını + CI `ajv` / eşdeğeri doğrulama.  
- **Birleşik regression** — EMCS manifest + EBVM trace + GDK politika sürümü.

---

## 12. Mutation policy (belge)

EMCS-1 bu dosyada **append-only**; §8–§10 ihlal eden geri yazım **EMCS-2** veya yeni major.

---

## 13. Geçmiş — kısa sürüm özeti (referans)

- **Patch:** Aynı constitution sınıfı; opsiyonel alan genişlemesi.  
- **Minor:** Yeni opsiyonel semantik bloklar; gate **değer** genişlemesi.  
- **Major:** Gate kümesi / cebir / `errorSpace` anlam değişimi.

---

## 14. Epistemic Operating System — dörtlü kapanış (EMCS · CSB · EBVM · GDK)

| Layer | Rol |
|-------|-----|
| **EMCS** | **Versioned law system** — izin verilen değerlendirme + sürüm/evrim |
| **CSB** | **Compositional semantics** — bileşik kısıt değerlendirme mantığı (`Bind`) |
| **EBVM** | **Clock-indexed execution graph generator** — tick’li trace / VM ([`EBVM-1`](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md)) |
| **GDK** | **Global ordering kernel** — `T_tick`, monotonicity, dağıtık sync; **runtime safety** (clock consistency) ([`GDK-1`](GLOBAL_DETERMINISM_KERNEL_V1.md)) |

Birleşince: **Epistemic Operating System** — framework / pipeline değil, **execution history üreten deterministik universe model** yüzeyi; `Execution ≈ VM(EMCS, CSB, Input)` yalnızca **GDK** altında tam replay-lenebilir.

**Mühendislik kazanımı:** debug ✓ · replay ✓ · determinism testable ✓ · version drift detectable ✓  

**Tek cümle:** EMCS anayasal law, CSB bileşik semantik, EBVM yürütüm grafiği, GDK global sıra — birlikte sistem **salt fonksiyon compute** değil; **tek canonical timeline** iddiası taşıyan **izlenebilir execution history** üretir ([`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) §7–8).

### 14.1 Sonraki mühendislik adımları

**A) EBVM ISA v2 (clocked)** — `runGate(…, tick)`; ticked trace graph ([`EBVM` §9](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#9-ebvm-isa-v2-clocked)).  

**B) EMCS upgrade algebra** — `T_upgrade` / `T_down` ön-son koşulları, witness cebiri ([§10.1–10.2](#101-upgrade--state-transition-function)).  

**C) GDK — Clock Formalization Proof Layer** — monotonicity enforcement; distributed sync §5.3 refinement; `GDK_ERR_*` matrisi; T1 operasyonel kırılma = clock yalnızca local ([`GLOBAL_DETERMINISM_KERNEL_V1.md`](GLOBAL_DETERMINISM_KERNEL_V1.md) §5–7, §10).  

**D) GECS (EBVM)** — graph canonicalization; replay equivalence; isomorphism ([`EBVM` §10](EVALUATE_BIND_VIRTUAL_MACHINE_V1.md#10-gecs-and-replayvmtrace-equivalence), [`GDK-1` §11](GLOBAL_DETERMINISM_KERNEL_V1.md#11-gdk-enforcement-pipeline-runtime)).

---

*EMCS-1 — EngineManifest: permitted evaluation algebra, not operational playbook.*
