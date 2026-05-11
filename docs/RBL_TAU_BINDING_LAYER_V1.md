# RBL-τ Binding Layer v1

**Rol:** RBL-1’in **doğal devamı** — `WitnessArtifact` ile **MK-1 τ** arasında **anayasal bağlama** kuralları. Köprü yalnızca mühür üretmek değil; **τ’nin kamusal kanıttan türetilebilir** olması ve **π-bağlamında** artefakt ile iz arasında **bire bir** (kanonik temsil üzerinden) eşleme gereklidir.

**Sürüm:** RBL-τ-1 (bu belge)  
**Durum:** `NORMATIVE_TARGET` — RTB-B1 için repo primitive: [`rblBindTau.mjs`](../scripts/rblBindTau.mjs)  
**Önkoşul:** [RBL-1](RBL_1_REALITY_BRIDGE_LAYER_V1.md) (`WitnessArtifact`, pipeline)  
**İlişkili:** [CGR-1](CGR_1_CONSTITUTIONALLY_GOVERNABLE_RUNTIME_V1.md) · [PAG-1](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) · [**RBL-τ Lineage**](RBL_TAU_LINEAGE_LAYER_V1.md) (root collapse / genealogy) · [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) (divergence) · [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) (resolution) · [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) (governance bind) · [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) (evolution / drift) · [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) · [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) · [UCFC / `projectPi`](../scripts/projectPi.mjs) · [`witnessArtifact.mjs`](../scripts/witnessArtifact.mjs)

**Okuma:** RBL-1 = **epistemic sensor** (kamusal witness). RTB-B1 = **epistemic isomorphism law** (kanonik taahhüt uzayında artefakt ↔ τ). Birleşince τ, **constrained semantic manifold** öğesi olarak okunur — sistem yalnızca “veri işleyen” değil, **kanıt uzayı** üzerinde kapalı kurallarla hareket eden bir **epistemic manifold engine** sözleşmesine yaklaşır.

---

## 0. Çekirdek önerme

> **τ (execution trace) must be derivable from:**  
> **`WitnessArtifact` (veya kanonik sıralı çoklu artefakt) + π + epoch + clock**  
> **+ EMCS manifest** (MK-1 yapısal sözleşmesi).

**Ters yön (π-bağlamında):** Sabit bir **binding context** altında, kanonik artefakt taahhüdü ile τ’nin RBL taahhüdü arasında **bijeksiyon** vardır:

```text
Artifact*  ↔  Trace     (under fixed π-context K)
```

Burada `*` **append-only ledger’dan gelen son commit kümesi** veya politika ile tanımlı **son `n` artefakt** olabilir; kanonikleştirme aşağıda sabittir.

**Dürüst sınır:** Bijeksiyon **ham JSON τ** üzerinde değil; **kanonik taahhüt uzayı** üzerindedir — `artifactHash` çokluğunun sıralı/sırasız kanon formu ve τ gövdesindeki **RBL kök alanı** (aşağıda) ile tanımlanır. Aksi, sıra-permutasyonları veya `projectPi` altında denk gövdeler yüzünden **yanılsama bijeksiyon** üretirdi (UCFC ile çelişir).

---

## 1. Binding context (K)

**Tanım — π-bağlamı** `K` (aynı çağrıda sabit):

| Bileşen | Anlam |
|---------|--------|
| **π** | `piHash` — yetkili projeksiyon parmak izi ([piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md)). |
| **Epoch** | `projectionEpochId` — τ ve tüm bağlı artefaktlarla **uyumlu** otorite/trace epoch hizası ([piEMS-1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)). |
| **Clock** | GDK uyumlu `clock` + τ üzerinde `mk1ClockWitness` politikası ([MK-1](MK1_KERNEL_VALIDATOR_V0_1.md), [GDK-1](GLOBAL_DETERMINISM_KERNEL_V1.md)). |
| **Manifest** | EMCS `manifest` — ANF / motor bağlayıcısı. |
| **Binding şeması** | `rblTauBindingVersion` — bu belgenin runtime etiketi; kanonikleştirme kuralı değişirse sürüm **artar**. |

**Kural:** `WitnessArtifact.piHash` ve `WitnessArtifact.projectionEpochId`, τ üretiminde kullanılan **π** ve **epoch** ile **birebir eşleşmeli**; aksi halde τ, o artefaktlardan **meşru türetilemez** (fail-closed).

---

## 2. İleri yön: Bind (artefakt → τ iskeleti)

Normatif **inşa** (soyut; somut `edges` / `nodes` şeması RBL-τ-1.1’de sabitlenir):

1. Girdi: doğrulanmış `WitnessArtifact[]` (`verifyArtifactSeal`), hepsi aynı `K` altında.  
2. **Kanonik artefakt kökü:** `artifactRoots = sort(unique(a.artifactHash))` — çoklu aynı mühür tekilleştirilir; sıra **lexicographic** (deterministik).  
3. τ gövdesi: EBVM/CSB üretim kurallarına uygun **kenarlar** + RBL alanı:  
   - `rblArtifactRoots: string[]` **≡** `artifactRoots`  
   - (opsiyonel) `rblBindingVersion: string`  
4. τ üzerinde **π / epoch / clock** alanları `K` ile doldurulur (`piHash`, `projectionEpochId`, `mk1ClockWitness`, …).  
5. **ANF / `projectPi` / `finalHash`:** τ, [MK-1](MK1_KERNEL_VALIDATOR_V0_1.md) + [UCFC](../scripts/projectPi.mjs) ile **kapanır** — `finalHash = H_canon(π(τ_body))` (günkü çekirdek sözleşmesi).

**Sonuç:** τ, yalnız kamusal artefakt taahhütleri + `K` + üretim cebiri ile **yeniden üretilebilir** (replay).

---

## 3. Ters yön: Unbind (τ → artefakt taahhüdü)

1. τ yapısal olarak geçerli bir gövde ise, `rblArtifactRoots` **okunur** (şema yoksa binding **tanımsız** — RTB-I2).  
2. `artifactRoots` = `rblArtifactRoots` kanonik sıralı biçimde (Bind ile aynı sıralama kuralı).  
3. Ledger veya storage’dan bu hash’lere karşılık gelen `WitnessArtifact` mühürleri yüklenir; her biri için `verifyArtifactSeal` (RBL-I4).

**π-bağlamı kontrolü:** Yüklenen her artefakt için `artifact.piHash === τ.piHash` ve epoch politikası uyumu; değilse **Unbind başarısız** (fail-closed).

---

## 4. Bijeksiyon yasası (π-context altında)

**Tanım:** `CanonBind(K)` = tüm `K` ile uyumlu, mühürü geçerli artefakt sonlu çoklukları / kanonik `artifactRoots` uzayı. `CanonTrace(K)` = `K` ile uyumlu, `rblArtifactRoots` taşıyan ve MK-1 gövde cebirine uyan τ kanonik sınıfı.

**Yasa RTB-B1 (bijeksiyon):** Sabit `K` için:

```text
Bind:   CanonBind(K)  →  CanonTrace(K)
Unbind: CanonTrace(K)  →  CanonBind(K)
```

ve `Unbind(Bind(A)) = A` **kanonik `artifactRoots` eşitliği** anlamında; `Bind(Unbind(τ))` ise τ’nin **UCFC kanon sınıfı** ile aynı `finalHash` ve aynı `artifactRoots` taahhüdünü gerektirir.

**Not:** τ içinde **yalnızca** `artifactHash` taşınır; ham payload bijeksiyonun parçası değildir — RBL-1 ile uyumlu **hash-only kernel sınırı**.

---

## 5. Binding invariants

| Kimlik | İfade |
|--------|--------|
| **RTB-I1** | **No τ without derivable artifact roots** — Üretim pipeline’ı dışında “sahici” τ yok; en azından `rblArtifactRoots` ile kanıt kökü bağlanır. |
| **RTB-I2** | **No silent bind** — `rblTauBindingVersion` veya eşdeğeri yoksa, τ **RBL-τ bağlı** sayılmaz (politika “explicit opt-in”). |
| **RTB-I3** | **π / epoch consistency** — Artefakt ile τ arasında `piHash` ve epoch ihlali **yasak** (PAG / πEFC öncesi bile audit için). |
| **RTB-I4** | **Canonical multiset** — `artifactRoots` her zaman **sıralı unique**; ledger’da tekrarlı append aynı hash’i tekilleştirir. |
| **RTB-I5** | **UCFC-respect** — Bind/Unbind, `projectPi` altında **gizli kenar sırası** ile oynayıp taahhüdü değiştiremez; τ gövdesi zaten π-projeksiyonuna tabi. |

---

## 5bis. Teknik risk: root collapse ambiguity

**Risk:** Yalnızca **`artifactRoots`** (sıralı unique hash listesi) taşınırsa ve **soy ağacı derinliği** (lineage) kaybolursa, **farklı provenance** aynı kök çokluğuna **çökebilir** → **epistemic collision** (aynı kanonik set, farklı tarihsel gerçekler).

**Yön (normatif):** [**RBL-τ Lineage Layer v1**](RBL_TAU_LINEAGE_LAYER_V1.md) — `artifactRoots` + `witnessSet` taahhüdü + **πEpoch lineage** + **`projectPi` imza zinciri** birlikte bağlanır; root collapse **RTBL** invariants ile kapatılır.

---

## 6. πEFC ve PAG ile sıra

```text
WitnessArtifact(s)  →  Bind(K)  →  τ  →  evaluateBindIndexed(τ, π, epoch, clock, manifest [, …])
```

- **RBL-τ:** dünya kanıtı → τ taahhüdü.  
- **PAG:** yetki bundle ön kapısı (opsiyonel).  
- **πEFC:** egemen karar.

---

## 7. Repo primitive (RTB-B1 + Lineage alanları)

[`scripts/rblBindTau.mjs`](../scripts/rblBindTau.mjs) — sürüm **`RBL_TAU_BINDING_0_2`** (Lineage: `rblWitnessCommitment`, `rblEpochLineage`).

| Export | Rol |
|--------|-----|
| `RBL_TAU_BINDING_VERSION` | `rblTauBindingVersion` sabiti (RTB-I2). |
| `canonicalArtifactRootList` / `canonicalRootsFromArtifacts` | RTB-I4 kanonik multiset. |
| `witnessCommitmentFromArtifacts` | [RBL-τ Lineage §1.2](RBL_TAU_LINEAGE_LAYER_V1.md) — `rblWitnessCommitment`. |
| `bindTraceFromArtifacts(artifacts, bindingContext, traceSkeleton)` | İleri bind → `rblWitnessCommitment`, `rblEpochLineage`, `projectPi` + `finalHash`. |
| `extractArtifactRootsFromTrace(trace)` | Ters bind; sürüm + kök doğrulaması. |
| `RTB_ERR_*` | Kapalı ret kodları. |

**Stress:** [`mk1StressHarness.mjs`](../scripts/mk1StressHarness.mjs) — `rtbRoundTrip`, `rtbBindPiMismatch`, `rtbExtractNoBinding`, `rtbContextualDeterminism`.

---

## 8. Sonraki adımlar

- [**RBL-D1**](RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md) — divergence semantics (witness / epoch / π çatışması).  
- [**RBL-R1**](RBL_R1_RESOLUTION_POLICY_ENGINE_V1.md) — V-CLASS çözüm politikası (seçim / ayırma / archive).  
- [**RBL-G1**](RBL_G1_GOVERNANCE_BINDING_LAYER_V1.md) — R1 ↔ PAG rolleri, veto/freeze, epoch, authority split.  
- [**RBL-A1**](RBL_A1_AUTHORITY_EVOLUTION_AND_DRIFT_LAYER_V1.md) — GCS sürümü, authority drift, epoch–authority senkron.  
- **RTB canonicalizer** — `rblLineage` tek nesne; çift kaynak drift önleme ([Lineage §4](RBL_TAU_LINEAGE_LAYER_V1.md)).  
- EBVM/CSB ile **traceSkeleton** tek kaynak.  
- [RBL-1 §7](RBL_1_REALITY_BRIDGE_LAYER_V1.md) bu belgeye **yönlendirilir**.

---

**Mühür (RBL-τ):**

> **Public roots, public trace — same π, same commitment.**

---

*RBL-τ Binding Layer v1 — τ derivable from witness + π + epoch + clock; bijection on canonical commitment space under π-context.*
