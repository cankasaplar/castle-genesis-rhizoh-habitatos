# Rhizoh — Proof-of-Consistency Layer (PoCL) (V1)

**Kısaltma:** **PoCL** (*Proof-of-Consistency Layer*).

**Rol:** [RDVH](RHIZOH_RUNTIME_DETERMINISM_VALIDATION_HARNESS_RDVH_V1.md) ile üretilen **izlenebilir koşu günlükleri** (*traces*) üzerinden, dağıtık kimlik icrasının **tutarlılığını** yalnızca “pass/fail” değil — **ispat diline** taşıyan üst katman. Bu belge **test harness’ının yerine geçmez**; RDVH çıktısına **bağlanan formal kapama** hedefidir.

**Durum:** `FORMAL_OPEN` — dört artefaktın tam ifadesi ve makine kontrollü ispat bu sürümün dışında tutulabilir; mimari **kapsam** burada sabittir.

**Üst okuma:** [DRAS §18.12–18.14](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) · **[FCTS](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md)** · **[MCF-1](RHIZOH_META_CONSISTENCY_FRAMEWORK_MCF1_V1.md)** · [DRAS §18.7](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) · [RCIL](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md) · [IRE-1](RHIZOH_IDENTITY_RUNTIME_ENGINE_IRE1_BLUEPRINT_V1.md).

---

## 1. Soru (tek cümle)

*RDVH trace’leri verildiğinde, **hangi tutarlılık iddiaları** hangi aksiyomlar altında **ispatlanabilir** veya **olasılıksal olarak sınırlanabilir**?*

---

## 2. Zorunlu dört artefakt (PoCL çekirdeği)

| # | Artefakt | Görev |
|---|----------|--------|
| **1** | **Formal equivalence proof under RDVH traces** | Seçilen trace sınıfı üzerinde, **EAERT** / **IBT** / **GCSB** ile tanımlı **denklik** ve **binding** ilişkisinin, yürütüm adımlarına indirgenmiş **formal ispat** (veya ispat şablonu) — *trace = kısıtlı model*. |
| **2** | **Probabilistic failure bound of divergence** | Kimlik / anlam sapması olayının (RDVH **divergence detector** çıktısı), verilen **kaos / gecikme** modelinde **üst olasılık sınırı** veya güven aralığı — *“ne kadar kötüleşebilir?”* sorusunun ölçülü cevabı. |
| **3** | **Entropy stability theorem under partition** | Ağ **partition** rejiminde, [DRAS §18.7](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) ile hizalı **entropy / collapse** büyüklüğünün **stabil** veya **sınırlı patlama** davranışı; interrupt politikalarının **tutarlı** kalması. |
| **4** | **Cross-node invariant persistence theorem** | Seçilen **çapraz-node invariant**’ların (ör. seal kuralları, EAERT I1–I5 türevleri, IBT MV-IIS parçaları) reconcile / merge sonrası **ne zaman korunur / ne zaman zorunlu kırılır** — **persistence** ve **cut** koşulları. |

---

## 3. RDVH ile ilişki (giriş verisi)

| RDVH çıktısı | PoCL’de kullanım |
|--------------|------------------|
| Replay günlüğü | **(1)** equivalence proof’un **somut modeli** |
| Consistency raporu | **(4)** invariant persistence için **önkoşul / counterexample** üretimi |
| Chaos / partition profili | **(2)(3)** için **ortam dağılımı** |
| Divergence imzası | **(2)** bound’ların **kalibre edilmesi** |

---

## 4. RCIL / IRE-1 ile ilişki

- **[RCIL](RHIZOH_RUNTIME_CONTRACTS_IMPLEMENTATION_LAYER_RCIL_V1.md)** *ne çalışır* ve *hangi sözleşmelerle*.  
- **[IRE-1](RHIZOH_IDENTITY_RUNTIME_ENGINE_IRE1_BLUEPRINT_V1.md)** *hangi döngü*.  
- **RDVH** *hangi trace’lerle ölçülür*.  
- **PoCL** *hangi iddialar trace üzerinde **kanıtlanır** veya **olasılıksal olarak sınırlanır***.

---

## 5. Çıkış kriteri (PoCL “kapandı” sayılması)

PoCL, aşağıdakiler **yazılı ve RDVH ile bağlantılı** olduğunda “kapalı” kabul edilir:

1. En az bir trace sınıfı için **tam** veya **şablonlu** equivalence proof zinciri.  
2. Seçilen stres modeli için **divergence** üzerinde **ispatlanabilir veya simüle edilebilir** olasılık üst sınırı.  
3. Partition altında entropy büyümesi için **net teorem ifadesi** (varsayımlar açık).  
4. En az bir çapraz-node invariant için **persistence / failure** teoremi (RRHP ile uyumlu).

---

## 6. FCTS ile ilişki (üst teorem sistemi)

**[FCTS — Full Consistency Theorem System](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md)**, PoCL dörtlüsünü **T1–T5** altında yeniden indeksler; özellikle **runtime → proof equivalence mapping (T5)** PoCL metninde ayrı isim taşımaz — FCTS ile **zorunlu üst bağ** olarak kapanır ([FCTS §3](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md)).

---

*PoCL V1 — Proof-of-Consistency Layer; RDVH trace → **formal tutarlılık iddiası** köprüsü; üst indeks: **[FCTS](RHIZOH_FULL_CONSISTENCY_THEOREM_SYSTEM_FCTS_V1.md)**; meta: **[MCF-1](RHIZOH_META_CONSISTENCY_FRAMEWORK_MCF1_V1.md)**.*
