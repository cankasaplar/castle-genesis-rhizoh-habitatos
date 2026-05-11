# π Compatibility Matrix Spec (piEMS-Compat-1)

**Rol:** π evriminde **çift yönlü** uyumu tek tabloda mühürler: hangi **πᵢ** ile hangi **πⱼ** arasında trace taşınabilir, **cross-epoch replay** ne zaman geçerlidir, **MK-1** hangi **tarihsel π** altında çağrılır, **backward interpretability** ne garanti edilir. Bu belge olmadan sistem güçlü kalır fakat **epoch fragmentation** — dağıtık ortamda **aynı artefaktın farklı düğümlerde farklı “anlam” statüsü** — riski artar.

**Sürüm:** piEMS-Compat-1  
**Durum:** `NORMATIVE_TARGET`  
**İlişkili:** [`PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md`](PAG_1_PROJECTION_AUTHORITY_GOVERNANCE_V1.md) (PAG-1) · [`PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md`](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) (piEMS-1, CUT_OVER §4.2.1) · [`MK1_KERNEL_VALIDATOR_V0_1.md`](MK1_KERNEL_VALIDATOR_V0_1.md) §11 (MK-1 range, PCEK) · [`PI_INDEXED_EVALUATION_CONTRACT_V1.md`](PI_INDEXED_EVALUATION_CONTRACT_V1.md) (piEFC-1) · [`PI_EFC_RUNTIME_FORMAL_SPEC_V1.md`](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) (πEFC-Runtime-1.0)

---

## 0. Problem

- `piHash` çoğalır; düğümler farklı epoch’ta kalabilir.  
- **Aynı τ**, farklı **authority π** ile farklı MK-1 sonucu verebilir ([piEMS §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)).  
- Uyum **sözlü** kalmamalı; **matris + kanıt yükü** (NON_BREAKING iddiası) formalize edilmelidir.

---

## 1. Nesneler

| Terim | Anlam |
|--------|--------|
| **Cell M[i,j]** | πᵢ (kaynak epoch) → πⱼ (hedef epoch) için uyumluluk **sınıfı** ([piEMS §2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md): NON_BREAKING / BREAKING / INCOMPARABLE). |
| **Replay validity** | τ, πᵢ ile üretilmişken **πⱼ motorunda yeniden yürütme / yeniden projeksiyon** sonrası MK-1’in ürettiği **acceptance class** (veya “replay tanımsız”). |
| **Historical π** | MK-1 çağrısında **τ’ye bağlı** seçilen π — `piHash_trace` ile sabitlenir; **current engine** π’si ile karıştırılmaz ([piEMS §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md)). |
| **Backward interpretability** | πⱼ **okuyucusu**, πᵢ ile mühürlü τ’yi **yanlış sınıflandırmadan** (sessiz upgrade yok) **ne okuyabilir** garantisi. |

---

## 2. Uyumluluk matrisi (M)

### 2.1 Şema

- Satırlar ve sütunlar **desteklenen** `piHash` (veya `projectionEpochId`) ile indekslenir.  
- **M[i,j] ∈ { NON_BREAKING, BREAKING, INCOMPARABLE }**.  
- **M[i,i] = NON_BREAKING** (refleksif).  
- Matris **yönlüdür**: M[i,j] ile M[j,i] aynı olmak **zorunda değil** (upgrade vs downgrade farklı politikalar).

### 2.2 Semantik (normatif hedef)

| M[i,j] | Cross-epoch replay | MK-1 under πⱼ (τ from πᵢ) |
|--------|---------------------|---------------------------|
| **NON_BREAKING** | τ doğrudan veya trivial re-bind; acceptance class **aynı** (kanıtlı küme üzerinde). | `validate(τ, manifest, clock; authority=πⱼ)` **yalnız** πᵢ=πⱼ veya matris garantisi altında **aynı sonuç** beklenir. |
| **BREAKING** | **Reprojection** veya EBVM replay **zorunlu**; aksi halde kabul **tanımsız** veya ret. | MK-1 sonucu **değişebilir**; sonuç **explicit** (ret kodu / migration gerekli). |
| **INCOMPARABLE** | Replay **yok**; yalnız archival / dış okuma. | MK-1 **çağrılmamalı** veya **ARCHIVAL_ONLY** mod — üretim pipeline’ına sokulmaz. |

### 2.3 Yayınlama

Matris **makine-okur** artefakt (ör. JSON / kilitli repo dosyası) + insan özeti; her **NON_BREAKING** hücre için **regresyon vektörü** referansı (piEMS-1.1 ile hizalanacak).

---

## 3. Cross-epoch trace replay validity

**Tanım:** τ, **Eᵢ** altında üretilmiş; **Eⱼ** ortamında “replay” veya “import” ediliyor.

**Kurallar:**

1. **M[i,j] = NON_BREAKING:** Replay **geçerli**; MK-1(τ, …, πⱼ) **beklenen** sonuç matris dokümantasyonunda verilir (genelde πᵢ ile aynı acceptance class).  
2. **M[i,j] = BREAKING:** Replay **koşullu** — migration pipeline tamamlanmadan **VALID** iddiası yok.  
3. **M[i,j] = INCOMPARABLE:** Replay **geçersiz** üretim anlamında; yalnız tarihsel arşiv.

**CUT_OVER ile ilişki:** CUT_OVER sonrası okuyucu **yalnız** `piHash_trace` ve M[i,j] ile τ’yi sınıflandırmalıdır; **engine default π** ile sessiz doğrulama [piEMS §4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) ihlalidir.

---

## 4. MK-1 acceptance under historical π

**İmza (kavramsal):** `MK1(τ, manifest, clock; π_authority)`

- **π_authority** varsayılan olarak **`piHash_trace`** (τ üzerindeki binding) **olmalıdır** — “tarihsel π”.  
- **Current engine** `piHash_engine` yalnızca **yeni üretim** veya **explicit upgrade** yolunda yetkili π seçer.  
- **Uyuşmazlık:** `piHash_trace` ≠ `piHash_engine` ve M[trace, engine] izin vermiyorsa → deterministik **epoch / policy** ret kodu (MK-1.1+); bu bir **bug** değil **governance boundary**’dir.

Bu sayede **same τ, different outcome** yalnızca **açık epoch / π etiketi** ile gözlemlenir.

---

## 5. Backward interpretability guarantee

**Garanti (hedef):** πⱼ okuyucusu, πᵢ trace’ine baktığında:

- **Ya** M[i,j] ve dokümantasyon ile **ne anlama geldiği** bellidir (NON_BREAKING / BREAKING prosedürü),  
- **Ya** INCOMPARABLE ise **yanlışlıkla VALID üretim** yapmaz (archival / reject).

**Yasak:** πⱼ’nin πᵢ trace’ini **sessizce** kendi π’sine “upgrade edilmiş” sayması (ontology drift gizleme).

---

## 6. Epoch fragmentation riski (bu spec olmadan)

Dağıtık sistemde düğümler farklı `piHash` taşır; **ortak matris yoksa**:

- Aynı τ **A düğümünde** kabul, **B düğümünde** ret — operasyon **flaky** sanır.  
- Gerçekte **distributed meaning system** without **shared compatibility contract** — **güçlü ama kırılgan**.

**piEMS-Compat-1** bu riski **paylaşılan M** ile düşürür; CUT_OVER [§4.2.1](PI_EVOLUTION_MIGRATION_SEMANTICS_V1.md) ile birlikte okunur.

---

## 7. İlişki özeti

| Belge | Soru |
|--------|------|
| piEMS-1 | Epoch **ne zaman** değişir; CUT_OVER **nasıl** güvenli? |
| **piEMS-Compat-1 (bu belge)** | πᵢ↔πⱼ **ne** anlama gelir; replay ve tarihsel MK-1 **nasıl**? |
| [piEFC-1](PI_INDEXED_EVALUATION_CONTRACT_V1.md) | Matris + MK-1 runtime’da `evaluateBind(τ,π,epoch,clock)` ile **nasıl** tek çıktıda birleşir? |
| [πEFC-Runtime-1.0](PI_EFC_RUNTIME_FORMAL_SPEC_V1.md) | Decision consistency, memoization, partial-eval sınırı, replay immutable layer |

---

*piEMS-Compat-1 — π compatibility matrix; cross-epoch replay; historical π; backward interpretability.*
