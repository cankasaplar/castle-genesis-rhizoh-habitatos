# Rhizoh — EAERT: Reality Manifold Topology & Split-Brain Geometry (V1)

**Rol:** [EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md) ve [DRAS V1](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) altında **“dağıtık gerçeklik başarısızlık altında ne olur?”** sorusunun **geometrik** cevabı. Bu belge **kanıt defteri** veya **kod şeması** değil — **failure-state geometry** (bölünme, sapma, çift gerçeklik, birleşme sınırı) için **normatif uzay tanımı**.

**Durum:** `NORMATIVE_TARGET` — **topoloji + split-brain modeli COMPLETE (spec)**; ölçüm / simülasyon / üretim **instantiation** ayrı sprint.

**Önkoşul:** [EAERT §3–§7](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md) · [DRAS §3–§4](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) · [WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md)

**Sıra notu:** [DRAS §11 (1)](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) maddesinin **ilk kapaması**; (2) **[Unified Theorem Set V1](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md)** ile **T_DRC** zinciri bağlandı.

---

## 0. Boşluk tanımı

Normatif dörtlü (ECR / GEJ / AIL / EAERT) **ideal bağlantılı** rejimde kapalıdır. Açık soru:

**distributed reality under failure conditions**

Burada “hata” yalnız **yanlış state** değil — **topological divergence of the reality manifold**: aynı kabul edilmiş aksiyomlar altında, farklı node **graf bileşenleri** üzerinde **uyumsuz global section** (tek “dünya yüzeyi”) oluşması.

**EAERT ihlali** = bu uzayda **denklik kaybı**; debug edilen tek satır bug’dan çok **yapısal ayrışma**.

---

## 1. Nesneler (soyut — somut instantiation’a açık)

| Nesne | Okuma |
|--------|--------|
| **Reality manifold (hedef)** | Tüm node’larda **aynı** materyalleşen, [EAERT A0–A1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md) ile uyumlu **tek tutarlı gerçeklik yüzeyi** (ideal: bağlı iletişim grafiği + sınırlı gecikme). |
| **Local chart** | Tek node (veya tek quorum bölgesi) üzerinde **gözlemlenebilir** projection: log + admission + transform sonrası **yerel gerçeklik**. |
| **Atlas** | Chart’ların birleşimi; **gluing law** = merge / replay / fence kuralları (ürün politikası + EAERT enforcement). |
| **Partition** | İletişim grafiğinin **kesilmesi**; global chart tek parça halinde **var olmayabilir**. |

Bu dil **diferansiyel manifold** iddiası taşımaz; **dağıtık sistem topolojisi** (graf bileşenleri, gecikme, kısmi replikasyon) için **ortak isim uzayı**dır.

---

## 2. Sağlam rejim (bağlı graf)

İletişim grafiği **bağlı** ve gecikme **bounded** (EAERT **I5**) iken:

- Yerel chart’lar **aynı causal input** altında **aynı reality outcome**’a yakınsar (hedef teorem ifadesi: [EAERT §7](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md)).
- **RDCL** her chart’ta **aynı türetimi** verir; **GEJ** aynı admission yüzeyini paylaşır; **AIL** aynı transform sınırlarında kalır; **EAERT** **gluing**’i korur.

Bu rejimde manifold = **tek bağlı bileşen** üzerinde **tutarlı atlas**.

---

## 3. Partition: graf bileşenleri

Partition anında graf **en az iki bileşene** ayrılır: \(C_1, C_2, \ldots\)

**Kritik nokta:** Sistem “tanımsız” olmak zorunda değildir; **tanımlı ama global olarak tek yüzey taşımayan** bir **regulated space**e geçer:

- Her \(C_i\) içinde **yerel tutarlılık** (ECR + GEJ + AIL + **bileşen-içi** EAERT) sürdürülebilir.
- **Bileşenler arası** henüz **tek section yok** → **global reality uniqueness** iddiası **askıda** (bilinçli **degraded mode**).

Bu, aşağıdaki **pozitif aksiyom** ile sabitlenir:

**A_partition (partition altında manifold disiplini):**

> *Under network partition, distributed reality does not collapse into an undefined system; it occupies a declared multi-chart regime with explicit per-component local consistency and explicit gluing obligations on heal.*

(Türkçe öz: *Partition altında gerçeklik uzayı “bozuk sistem” değil; bileşen başına yerel tutarlılık + iyileşmede açık yapıştırma yükümlülüğü ile tanımlı çok-chart rejimidir.*)

---

## 4. Split-brain geometrisi

**Split-brain** = iki (veya daha fazla) **canlı** bileşen, **aynı kimlik / aynı namespace** altında **farklı incompatible chart** üretir.

| Öğe | Anlam |
|-----|--------|
| **İki gerçeklik** | İki \(C_i\) üzerinde **farklı admissible transform zincirleri** veya **farklı projection** → kullanıcı veya gözlemci için **aynı “dünya” etiketi**, **farklı materyal sonuç** |
| **Divergence şekli** | **Fork:** ayrı commit hatları · **Wedge:** admission/policy görünümü ayrışır · **Cone:** bir tarafta partial enforcement, diğerinde tam · **Lag sheet:** async replikasyon; geçici “üst üste binen” chart’lar |
| **Örtüşme bölgesi** | Heal öncesi: ya **yok** (tam split) ya da **stale read yüzeyi** (cache / bypass / kısmi SoT) — [EAERT D sınıfı](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md) |

**EAERT’in fizik tarafı:** partition + yarış + yarım gate + bypass, **aynı aksiyom kümesini** korusa bile **global section**’ı **koparır** veya **geciktirir** — bu **topolojik** olaydır.

---

## 5. “İki gerçeklik”in formal özü

İki gerçeklik = iki chart \(\phi_1, \phi_2\) için:

- Aynı **dış isimlendirme** (ör. aynı aggregate id, aynı “world” handle),
- Fakat **merge edilemeyen** veya **tek atomic gluing ile birleştirilemeyen** **causal future** (çakışan admission, çakışan transform uygulaması, veya çakışan projection versiyonu).

**Reconciliation limiti:** CAP-benzeri gerilim altında **her şey birleştirilemez**; ürün **explicit conflict surface** veya **tek taraflı fence / kazanan quorum** seçmek zorundadır ([WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md) ile hizalı).

---

## 6. EAERT ihlali = topolojik ayrışma

| İhlal tipi | Topolojik okuma |
|------------|------------------|
| **I4 (sessiz sapma)** | İki chart **farkında olunmadan** birlikte var — atlas **patlak** |
| **I5 aşımı (sınırsız lag)** | Gluing **asla gelmiyor** — section **yok**; kullanıcı için “tek dünya” yalanı |
| **Split-brain yazım** | İki bileşen **aynı commit yüzeyine** yazmayı iddia eder — **çakışan global chart** |
| **Partial enforcement** | Bir chart’ta gate var, diğerinde yok — **differential structure** (tek atlas değil) |

**Soru artık:** “State yanlış mı?” değil — **“Hangi chart geçerli ve hangi gluing yasası uygulanıyor?”**

---

## 7. Drift, clock skew, kısmi replikasyon

Bunlar split-brain değilken bile **chart kayması** üretir:

- **Clock drift:** sıra semantiği / TTL / fence zamanı — **I2** stresi.
- **Partial replication:** bazı node’lar **eksik prefix** — **I3** ile gerilim; RDCL öncesi okuma riski.
- **Async commit lag:** **I5**; bounded ise **regulated**; unbounded ise **topolojik kopuş** riski.

Hepsi **EAERT stres alanı**dır ([DRAS §10](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md)).

---

## 8. Tasarım çıktıları (instantiation’a köprü)

Normatif olarak ürün şunları **açık seçer** (bu belge seçim yapmaz; uzayı tanımlar):

1. **Quorum / fence** — split-brain yazımını **topolojik olarak** engelleme veya tek kazanan bileşen.
2. **Fail-closed read** — glue yokken **yanlış global section** okumayı reddetme.
3. **Merge policy** — çatışan chart’lar için **deterministik** çözüm veya **insan-onaylı** yüzey.
4. **Bounded lag sözü** — **I5** ile uyumlu **dürüst ürün dili**.

---

## 9. İlişki tablosu (özet)

| Katman | Partition altı rol |
|--------|---------------------|
| **ECR** | Her bileşende **ontology** tutarlılığı (yerel türetim). |
| **GEJ** | Bileşen başına **admission**; policy drift **wedge** kaynağı. |
| **AIL** | Bileşen başına **transform**; fork ile birleşince **çatışan future**. |
| **EAERT** | **Gluing** + denklik; ihlal → **topological divergence**. |
| **WC-PF / RDCL** | Bozulma **tespit** ve **rebuild** yolları — manifold onarımı değil, **chart onarımı**. |

---

## 10. Sonraki normatif sıra

1. **DRAS unified theorem set** (**T_DRC** / **T_reg**) — **[V1 — KAPALI (spec)](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md)**  
2. **ECR Axiomatic System Card** (minimal indirgenemez çekirdek) — **[V1 — KAPALI (spec)](RHIZOH_ECR_AXIOMATIC_SYSTEM_CARD_V1.md)**

---

## 11. İlişkili belgeler

- [DRAS V1](RHIZOH_DISTRIBUTED_REALITY_AXIOMATIC_SYSTEM_DRAS_V1.md) · **[DRAS Unified Theorem Set V1](RHIZOH_DRAS_UNIFIED_REALITY_THEOREM_SET_V1.md)** (**T_DRC** / **T_reg**) · **[ECR Axiomatic System Card V1](RHIZOH_ECR_AXIOMATIC_SYSTEM_CARD_V1.md)**  
- [EAERT V1](RHIZOH_EAERT_EXECUTION_EQUIVALENCE_V1.md) · [GEJ-1](RHIZOH_AIL1_GOVERNANCE_EXECUTION_JUNCTION_V1.md) · [ECR](RHIZOH_EPISTEMIC_CONTINUITY_RUNTIME_ECR_V1.md)  
- [WC-PF](RHIZOH_WORLD_CONSISTENCY_PARTIAL_FAILURE_V1.md) · [RDCL Implementation Map](RHIZOH_RDCL_IMPLEMENTATION_MAP_V1.md) · **[IFL V1](RHIZOH_INSTANTIATION_FIDELITY_LAYER_V1.md)** (instantiation / partition stress) · **[RRHP V1](RHIZOH_REALITY_RECONCILIATION_HEALING_PHYSICS_V1.md)** (split → merge / gluing icrası)

---

*EAERT Reality Manifold Topology V1 — partition geometry + split-brain; DRAS (1) kapaması.*
