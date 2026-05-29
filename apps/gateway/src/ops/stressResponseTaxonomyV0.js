/**
 * Stress Response Taxonomy v0 — Phase 3 must be observable AND interpretable.
 * Conflict resolution: priority tree + confidence + hybrid response (adversarial-safe).
 * @see docs/ops/STRESS_RESPONSE_TAXONOMY_V1.0.md
 */

export const STRESS_RESPONSE_TAXONOMY_SCHEMA_V0 = "rhizoh.stress_response.taxonomy.v0";

/** @readonly */
export const STRESS_CLASS_V0 = Object.freeze({
  OVERLOAD: "overload",
  ATTACK: "attack",
  COST_SPIKE: "cost_spike",
  DRIFT: "drift",
  OUTAGE: "outage",
  NONE: "none"
});

/** @readonly */
export const RESPONSE_ACTION_V0 = Object.freeze({
  DEGRADE: "degrade",
  ISOLATE: "isolate",
  THROTTLE: "throttle",
  FLAG: "flag",
  FALLBACK: "fallback",
  ALLOW: "allow"
});

/** @readonly — lower index = higher priority (attack wins over overload). */
export const STRESS_CLASS_PRIORITY_V0 = Object.freeze([
  STRESS_CLASS_V0.ATTACK,
  STRESS_CLASS_V0.OUTAGE,
  STRESS_CLASS_V0.COST_SPIKE,
  STRESS_CLASS_V0.OVERLOAD,
  STRESS_CLASS_V0.DRIFT,
  STRESS_CLASS_V0.NONE
]);

/** @readonly — strictest response wins in hybrid mode. */
export const RESPONSE_ACTION_SEVERITY_V0 = Object.freeze({
  [RESPONSE_ACTION_V0.ISOLATE]: 5,
  [RESPONSE_ACTION_V0.THROTTLE]: 4,
  [RESPONSE_ACTION_V0.FALLBACK]: 4,
  [RESPONSE_ACTION_V0.DEGRADE]: 3,
  [RESPONSE_ACTION_V0.FLAG]: 1,
  [RESPONSE_ACTION_V0.ALLOW]: 0
});

/** @readonly */
export const CONFLICT_RESOLUTION_V0 = Object.freeze({
  SINGLE: "single",
  PRIORITY_TREE: "priority_tree",
  HYBRID: "hybrid",
  ADVERSARIAL_ESCALATION: "adversarial_escalation"
});

/** Doc reference midpoint; hysteresis uses enter/exit to prevent boundary oscillation. */
export const ACTION_CONFIDENCE_THRESHOLD_V0 = 0.7;

/** Below enter → soften (when ladder applies). */
export const ACTION_CONFIDENCE_SOFTEN_ENTER_V0 = 0.68;

/** At or above exit → full strict reflex (no soften). */
export const ACTION_CONFIDENCE_STRICT_FULL_V0 = 0.72;

/** Dead band [enter, exit): always soften + actionBorderline — stable under micro input drift. */
export const ACTION_CONFIDENCE_DEAD_BAND_V0 = Object.freeze({
  enter: ACTION_CONFIDENCE_SOFTEN_ENTER_V0,
  exit: ACTION_CONFIDENCE_STRICT_FULL_V0
});

/** @readonly — composite resolutions reduce action confidence, not label. */
const ACTION_CONFIDENCE_PENALTY_V0 = Object.freeze({
  [CONFLICT_RESOLUTION_V0.SINGLE]: 0,
  [CONFLICT_RESOLUTION_V0.PRIORITY_TREE]: 0.06,
  [CONFLICT_RESOLUTION_V0.HYBRID]: 0.02,
  [CONFLICT_RESOLUTION_V0.ADVERSARIAL_ESCALATION]: 0.03
});

/**
 * Canonical mapping: internal code → taxonomy.
 * @type {Record<string, { stressClass: string, responseAction: string, userMessageTr: string }>}
 */
const CODE_MAP = Object.freeze({
  phased_rollout_capacity: {
    stressClass: STRESS_CLASS_V0.OVERLOAD,
    responseAction: RESPONSE_ACTION_V0.DEGRADE,
    userMessageTr: "Sistem yoğun — hizmet geçici olarak yavaşlatıldı."
  },
  rate_limit_exceeded: {
    stressClass: STRESS_CLASS_V0.OVERLOAD,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "İstek hızı sınırı — kısa süre sonra tekrar deneyin."
  },
  agent_turn_in_flight: {
    stressClass: STRESS_CLASS_V0.OVERLOAD,
    responseAction: RESPONSE_ACTION_V0.DEGRADE,
    userMessageTr: "Önceki işlem tamamlanmadı."
  },
  agent_max_iterations: {
    stressClass: STRESS_CLASS_V0.OVERLOAD,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "Oturum işlem sınırına ulaşıldı."
  },
  agent_session_token_ceiling: {
    stressClass: STRESS_CLASS_V0.OVERLOAD,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "Oturum kullanım tavanına ulaşıldı."
  },
  prompt_abuse_detected: {
    stressClass: STRESS_CLASS_V0.ATTACK,
    responseAction: RESPONSE_ACTION_V0.ISOLATE,
    userMessageTr: "İstek güvenlik politikasına takıldı."
  },
  user_soft_blocked: {
    stressClass: STRESS_CLASS_V0.ATTACK,
    responseAction: RESPONSE_ACTION_V0.ISOLATE,
    userMessageTr: "Hesap geçici olarak kısıtlandı."
  },
  agent_recursive_tool_lock: {
    stressClass: STRESS_CLASS_V0.ATTACK,
    responseAction: RESPONSE_ACTION_V0.ISOLATE,
    userMessageTr: "Araç çağrısı güvenlik sınırına takıldı."
  },
  agent_emergency_disable: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.FALLBACK,
    userMessageTr: "AI katmanı acil durumda devre dışı."
  },
  cost_hard_limit: {
    stressClass: STRESS_CLASS_V0.COST_SPIKE,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "Günlük kullanım tavanına ulaşıldı."
  },
  cost_global_usd_hard_limit: {
    stressClass: STRESS_CLASS_V0.COST_SPIKE,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "Sistem günlük maliyet tavanına ulaştı."
  },
  cost_ledger_unavailable: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "Maliyet defteri geçici olarak kullanılamıyor."
  },
  cost_ledger_record_failed: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "Maliyet kaydı tamamlanamadı; işlem güvenlik için durduruldu."
  },
  cost_ledger_drift_enforced: {
    stressClass: STRESS_CLASS_V0.DRIFT,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "Maliyet doğrulaması sağlayıcı kayıtlarıyla uyuşmuyor."
  },
  phased_rollout_unavailable: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.THROTTLE,
    userMessageTr: "Kapasite denetimi geçici olarak kullanılamıyor."
  },
  cost_soft_downgrade: {
    stressClass: STRESS_CLASS_V0.COST_SPIKE,
    responseAction: RESPONSE_ACTION_V0.DEGRADE,
    userMessageTr: "Yüksek kullanım — hafif moda geçildi."
  },
  behavioral_drift_suspected: {
    stressClass: STRESS_CLASS_V0.DRIFT,
    responseAction: RESPONSE_ACTION_V0.FLAG,
    userMessageTr: "Davranış ölçümü referanstan sapma gösteriyor (izleme)."
  },
  provider_http_502: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.FALLBACK,
    userMessageTr: "Sağlayıcı geçici olarak yanıt vermiyor."
  },
  provider_http_503: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.FALLBACK,
    userMessageTr: "Sağlayıcı geçici olarak yanıt vermiyor."
  },
  provider_http_504: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.FALLBACK,
    userMessageTr: "Sağlayıcı zaman aşımı."
  },
  provider_error: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.FALLBACK,
    userMessageTr: "Bağlantı geçici olarak kesildi."
  },
  timeout: {
    stressClass: STRESS_CLASS_V0.OUTAGE,
    responseAction: RESPONSE_ACTION_V0.FALLBACK,
    userMessageTr: "İstek zaman aşımı."
  }
});

const ABUSE_RISK_FLAG_RE =
  /abuse|attack|jailbreak|injection|prompt_abuse|malicious|ignore.previous/i;

/**
 * @param {string} code
 */
function normalizeStressCodeV0(code) {
  const c = String(code || "").trim();
  if (c.startsWith("provider_http_")) {
    const st = c.replace("provider_http_", "");
    if (CODE_MAP[`provider_http_${st}`]) return `provider_http_${st}`;
    return "provider_error";
  }
  if (/^agent_/.test(c)) return c;
  return c || "unknown";
}

/**
 * @param {string} normalized
 */
function mapCodeToStressV0(normalized) {
  const mapped = CODE_MAP[normalized];
  if (mapped) {
    return {
      code: normalized,
      stressClass: mapped.stressClass,
      responseAction: mapped.responseAction,
      interpretable: true,
      userMessageTr: mapped.userMessageTr
    };
  }
  if (!normalized || normalized === "none" || normalized === "unknown") {
    return {
      code: "none",
      stressClass: STRESS_CLASS_V0.NONE,
      responseAction: RESPONSE_ACTION_V0.ALLOW,
      interpretable: true,
      userMessageTr: null
    };
  }
  return {
    code: normalized,
    stressClass: STRESS_CLASS_V0.OVERLOAD,
    responseAction: RESPONSE_ACTION_V0.DEGRADE,
    interpretable: false,
    userMessageTr: "Bilinmeyen stres kodu — varsayılan degrade."
  };
}

/**
 * @param {number} priorityIndex — lower = higher priority class
 */
function stressClassRankV0(stressClass) {
  const idx = STRESS_CLASS_PRIORITY_V0.indexOf(stressClass);
  return idx === -1 ? STRESS_CLASS_PRIORITY_V0.length : idx;
}

/**
 * @param {string} action
 */
function responseActionRankV0(action) {
  return RESPONSE_ACTION_SEVERITY_V0[action] ?? 0;
}

/**
 * Collect all applicable stress codes from turn context (multi-signal).
 * @param {{
 *   code?: string | null,
 *   codes?: string[] | null,
 *   costCode?: string | null,
 *   containmentCode?: string | null,
 *   driftSuspected?: boolean,
 *   providerHttpStatus?: number | null,
 *   rhizohFailureKind?: string | null,
 *   riskFlags?: string[] | null,
 *   injectionFlag?: boolean
 * }} input
 * @returns {{ code: string, source: string }[]}
 */
export function collectStressSignalsV0(input = {}) {
  /** @type {{ code: string, source: string }[]} */
  const out = [];
  const push = (code, source) => {
    if (!code) return;
    const n = normalizeStressCodeV0(code);
    if (n === "none") return;
    if (out.some((x) => x.code === n)) return;
    out.push({ code: n, source });
  };

  if (Array.isArray(input.codes)) {
    for (const c of input.codes) push(c, "explicit_codes");
  }
  push(input.containmentCode, "containment");
  push(input.costCode, "cost");
  push(input.code, "primary_code");

  if (input.driftSuspected) push("behavioral_drift_suspected", "drift_probe");
  if (input.providerHttpStatus != null) {
    push(`provider_http_${input.providerHttpStatus}`, "provider_http");
  }
  if (input.rhizohFailureKind === "rate_limit") push("rate_limit_exceeded", "failure_kind");
  if (input.rhizohFailureKind === "timeout") push("timeout", "failure_kind");
  if (input.rhizohFailureKind === "policy_block") push("prompt_abuse_detected", "failure_kind");

  const flags = input.riskFlags || [];
  if (input.injectionFlag === true || flags.some((f) => ABUSE_RISK_FLAG_RE.test(String(f)))) {
    push("prompt_abuse_detected", "risk_flag");
  }

  return out;
}

/**
 * Adversarial camouflage: overload-shaped surface + abuse/injection → escalate to attack.
 * @param {{ stressClass: string, code: string }[]} mapped
 * @param {{ injectionFlag?: boolean, riskFlags?: string[] }} meta
 */
function applyAdversarialCamouflageGuardV0(mapped, meta = {}) {
  const hasAttack = mapped.some((m) => m.stressClass === STRESS_CLASS_V0.ATTACK);
  const hasOverload = mapped.some((m) => m.stressClass === STRESS_CLASS_V0.OVERLOAD);
  const abuseContext =
    meta.injectionFlag === true ||
    (meta.riskFlags || []).some((f) => ABUSE_RISK_FLAG_RE.test(String(f)));

  const camouflage = abuseContext && hasOverload;
  if (!camouflage) return { mapped, escalated: false };

  if (hasAttack) return { mapped, escalated: true };

  return {
    mapped: [...mapped, mapCodeToStressV0("prompt_abuse_detected")],
    escalated: true
  };
}

/**
 * Resolve multi-signal conflict: priority tree primary + hybrid response actions.
 * @param {ReturnType<typeof mapCodeToStressV0>[]} mapped
 * @param {{ escalated?: boolean }} meta
 */
export function resolveStressConflictV0(mapped, meta = {}) {
  if (!mapped.length) {
    const none = mapCodeToStressV0("none");
    return {
      primary: none,
      secondary: [],
      responseActions: [none.responseAction],
      conflictResolution: CONFLICT_RESOLUTION_V0.SINGLE,
      stressConfidence: 0.92
    };
  }

  const byClass = new Map();
  for (const m of mapped) {
    const prev = byClass.get(m.stressClass);
    if (!prev || stressClassRankV0(m.stressClass) < stressClassRankV0(prev.stressClass)) {
      byClass.set(m.stressClass, m);
    }
  }

  const classes = [...byClass.keys()].sort(
    (a, b) => stressClassRankV0(a) - stressClassRankV0(b)
  );

  const nonDrift = classes.filter((c) => c !== STRESS_CLASS_V0.DRIFT && c !== STRESS_CLASS_V0.NONE);
  const primaryClass =
    nonDrift[0] || classes.find((c) => c === STRESS_CLASS_V0.DRIFT) || STRESS_CLASS_V0.NONE;
  const primary = byClass.get(primaryClass) || mapCodeToStressV0("none");

  const secondary = classes.filter((c) => c !== primaryClass);

  /** @type {string[]} */
  const responseActions = [];
  const addAction = (a) => {
    if (a && !responseActions.includes(a)) responseActions.push(a);
  };

  addAction(primary.responseAction);
  for (const sc of secondary) {
    const entry = byClass.get(sc);
    if (entry) addAction(entry.responseAction);
  }

  responseActions.sort((a, b) => responseActionRankV0(b) - responseActionRankV0(a));
  const responseAction = responseActions[0] || primary.responseAction;

  let conflictResolution = CONFLICT_RESOLUTION_V0.SINGLE;
  let stressConfidence = 0.92;

  if (meta.escalated) {
    conflictResolution = CONFLICT_RESOLUTION_V0.ADVERSARIAL_ESCALATION;
    stressConfidence = 0.78;
    if (primary.stressClass === STRESS_CLASS_V0.ATTACK && secondary.includes(STRESS_CLASS_V0.OVERLOAD)) {
      stressConfidence = 0.82;
    }
  } else if (mapped.length > 1) {
    if (secondary.length > 0 && secondary.includes(STRESS_CLASS_V0.DRIFT)) {
      conflictResolution = CONFLICT_RESOLUTION_V0.HYBRID;
      stressConfidence = 0.8;
    } else {
      conflictResolution = CONFLICT_RESOLUTION_V0.PRIORITY_TREE;
      stressConfidence = 0.74;
    }
  }

  const allSameClass = mapped.every((m) => m.stressClass === primary.stressClass);
  if (mapped.length > 1 && allSameClass) {
    stressConfidence = 0.95;
    conflictResolution = CONFLICT_RESOLUTION_V0.SINGLE;
  }
  if (!primary.interpretable) stressConfidence = Math.min(stressConfidence, 0.38);

  return {
    primary,
    secondary,
    responseActions,
    responseAction,
    conflictResolution,
    stressConfidence
  };
}

/**
 * Deterministic input key for stability envelope (same bytes → same resolution).
 * @param {Parameters<typeof collectStressSignalsV0>[0]} input
 */
export function canonicalizeStressInputV0(input = {}) {
  const signals = collectStressSignalsV0(input);
  return JSON.stringify({
    codes: signals.map((s) => s.code).sort(),
    drift: input.driftSuspected === true,
    injection: input.injectionFlag === true,
    provider: input.providerHttpStatus ?? null,
    failureKind: input.rhizohFailureKind ?? null,
    flags: [...(input.riskFlags || [])].map(String).sort()
  });
}

/** User-visible copy follows applied action (UX = execution layer, not strict ops layer). */
const APPLIED_ACTION_USER_MESSAGE_TR_V0 = Object.freeze({
  [RESPONSE_ACTION_V0.ISOLATE]: "İstek güvenlik politikasına takıldı.",
  [RESPONSE_ACTION_V0.THROTTLE]: "İstek geçici olarak sınırlandı.",
  [RESPONSE_ACTION_V0.DEGRADE]: "Hizmet geçici olarak hafif modda.",
  [RESPONSE_ACTION_V0.FALLBACK]: "Bağlantı geçici olarak kesildi.",
  [RESPONSE_ACTION_V0.FLAG]: "Davranış izleme modunda (işlem devam edebilir).",
  [RESPONSE_ACTION_V0.ALLOW]: null
});

/**
 * Action confidence hysteresis: prevents 0.68–0.72 band flip-flop on near-identical inputs.
 * @param {string} strictAction
 * @param {number} actionConfidence
 */
export function applyActionConfidenceSofteningV0(strictAction, actionConfidence) {
  const strict = strictAction || RESPONSE_ACTION_V0.ALLOW;
  const ac = Number(actionConfidence) || 0;

  if (ac >= ACTION_CONFIDENCE_STRICT_FULL_V0) {
    return {
      responseAction: strict,
      responseActionStrict: strict,
      actionSoftened: false,
      actionBorderline: false,
      actionConfidence: ac
    };
  }

  const inDeadBand =
    ac >= ACTION_CONFIDENCE_SOFTEN_ENTER_V0 && ac < ACTION_CONFIDENCE_STRICT_FULL_V0;

  /** @type {Record<string, string>} */
  const softenStep = {
    [RESPONSE_ACTION_V0.ISOLATE]: RESPONSE_ACTION_V0.THROTTLE,
    [RESPONSE_ACTION_V0.THROTTLE]: RESPONSE_ACTION_V0.DEGRADE,
    [RESPONSE_ACTION_V0.FALLBACK]: RESPONSE_ACTION_V0.DEGRADE
  };

  let applied = strict;
  let softened = false;
  if (softenStep[strict]) {
    applied = softenStep[strict];
    softened = true;
  } else if (strict === RESPONSE_ACTION_V0.DEGRADE && ac < 0.55) {
    applied = RESPONSE_ACTION_V0.FLAG;
    softened = true;
  }

  return {
    responseAction: applied,
    responseActionStrict: strict,
    actionSoftened: softened,
    actionBorderline: inDeadBand && softened,
    actionConfidence: softened ? Math.max(0.35, ac * 0.92) : ac
  };
}

/**
 * UX-facing message from applied action (dual-layer: user sees execution, ops sees strict).
 * @param {string} appliedAction
 * @param {string | null | undefined} labelMessageTr
 */
export function resolveUserFacingStressMessageV0(appliedAction, labelMessageTr) {
  const applied = APPLIED_ACTION_USER_MESSAGE_TR_V0[appliedAction];
  return applied ?? labelMessageTr ?? null;
}

/**
 * @param {{
 *   code?: string | null,
 *   codes?: string[] | null,
 *   rhizohFailureKind?: string | null,
 *   costCode?: string | null,
 *   containmentCode?: string | null,
 *   driftSuspected?: boolean,
 *   providerHttpStatus?: number | null,
 *   riskFlags?: string[] | null,
 *   injectionFlag?: boolean
 * }} input
 */
export function classifyStressResponseV0(input = {}) {
  const signals = collectStressSignalsV0(input);
  let mapped = signals.map((s) => ({
    ...mapCodeToStressV0(s.code),
    source: s.source
  }));

  const guard = applyAdversarialCamouflageGuardV0(mapped, input);
  mapped = guard.mapped;

  const resolved = resolveStressConflictV0(mapped, { escalated: guard.escalated });
  const { primary, secondary, responseActions, responseAction, conflictResolution, stressConfidence } =
    resolved;

  const actionConfidenceBase = Math.max(
    0.35,
    stressConfidence - (ACTION_CONFIDENCE_PENALTY_V0[conflictResolution] ?? 0)
  );
  const action = applyActionConfidenceSofteningV0(responseAction, actionConfidenceBase);
  const appliedActions = responseActions.map((a) =>
    a === responseAction ? action.responseAction : a
  );
  if (action.actionSoftened && !appliedActions.includes(action.responseAction)) {
    appliedActions.unshift(action.responseAction);
  }

  const matrixSecondary =
    secondary.length > 0 ? ` + [${secondary.join(", ")}]` : "";
  const softenNote = action.actionSoftened
    ? ` [softened: ${action.responseActionStrict}→${action.responseAction}]`
    : "";
  const matrix =
    appliedActions.length > 1
      ? `${primary.stressClass} → ${action.responseAction} (hybrid: ${appliedActions.join(" + ")})${softenNote}`
      : `${primary.stressClass} → ${action.responseAction}${matrixSecondary}${softenNote}`;

  const labelInterpretable = primary.interpretable && stressConfidence >= ACTION_CONFIDENCE_THRESHOLD_V0;
  const actionInterpretable =
    labelInterpretable && action.actionConfidence >= ACTION_CONFIDENCE_STRICT_FULL_V0;

  const userMessageTr = resolveUserFacingStressMessageV0(
    action.responseAction,
    primary.userMessageTr
  );

  return Object.freeze({
    schema: STRESS_RESPONSE_TAXONOMY_SCHEMA_V0,
    executionModel: "truth_stable_execution_adaptive",
    code: primary.code,
    stressClass: primary.stressClass,
    responseAction: action.responseAction,
    userFacingAction: action.responseAction,
    responseActionStrict: action.responseActionStrict,
    responseActions: Object.freeze([...appliedActions]),
    stressSecondary: Object.freeze(secondary),
    stressSignals: Object.freeze(
      mapped.map((m) => Object.freeze({ code: m.code, stressClass: m.stressClass, source: m.source || "code_map" }))
    ),
    stressConfidence,
    actionConfidence: action.actionSoftened ? action.actionConfidence : actionConfidenceBase,
    actionSoftened: action.actionSoftened,
    actionBorderline: action.actionBorderline,
    conflictResolution,
    interpretable: labelInterpretable,
    actionInterpretable,
    userMessageTr,
    matrix,
    priorityTree: Object.freeze([...STRESS_CLASS_PRIORITY_V0]),
    resolutionInputCanonical: canonicalizeStressInputV0(input)
  });
}

/**
 * Phase 3 gate: every required class must have ≥1 mapped code.
 */
export function verifyStressTaxonomyCoverageV0() {
  const required = [
    { stressClass: STRESS_CLASS_V0.OVERLOAD, responseAction: RESPONSE_ACTION_V0.DEGRADE },
    { stressClass: STRESS_CLASS_V0.ATTACK, responseAction: RESPONSE_ACTION_V0.ISOLATE },
    { stressClass: STRESS_CLASS_V0.COST_SPIKE, responseAction: RESPONSE_ACTION_V0.THROTTLE },
    { stressClass: STRESS_CLASS_V0.DRIFT, responseAction: RESPONSE_ACTION_V0.FLAG },
    { stressClass: STRESS_CLASS_V0.OUTAGE, responseAction: RESPONSE_ACTION_V0.FALLBACK }
  ];
  const entries = Object.entries(CODE_MAP);
  const results = required.map((req) => {
    const hits = entries.filter(([, v]) => v.stressClass === req.stressClass && v.responseAction === req.responseAction);
    return { ...req, covered: hits.length > 0, exampleCodes: hits.map(([k]) => k).slice(0, 3) };
  });
  return {
    pass: results.every((r) => r.covered),
    required: results
  };
}

/**
 * Conflict resolution regression scenarios (Phase 3 pre-gate).
 */
export function verifyStressConflictResolutionV0() {
  const scenarios = [
    {
      name: "attack_beats_cost_spike",
      input: { codes: ["prompt_abuse_detected", "cost_hard_limit"] },
      expectPrimary: STRESS_CLASS_V0.ATTACK,
      expectActionStrict: RESPONSE_ACTION_V0.ISOLATE,
      expectAction: RESPONSE_ACTION_V0.THROTTLE,
      expectActionSoftened: true
    },
    {
      name: "drift_plus_overload_hybrid",
      input: { codes: ["phased_rollout_capacity", "behavioral_drift_suspected"] },
      expectPrimary: STRESS_CLASS_V0.OVERLOAD,
      expectSecondary: [STRESS_CLASS_V0.DRIFT],
      expectResolution: CONFLICT_RESOLUTION_V0.HYBRID
    },
    {
      name: "outage_not_drift",
      input: { codes: ["provider_http_503", "behavioral_drift_suspected"] },
      expectPrimary: STRESS_CLASS_V0.OUTAGE,
      expectAction: RESPONSE_ACTION_V0.FALLBACK
    },
    {
      name: "camouflage_escalation",
      input: {
        code: "rate_limit_exceeded",
        injectionFlag: true
      },
      expectPrimary: STRESS_CLASS_V0.ATTACK,
      expectResolution: CONFLICT_RESOLUTION_V0.ADVERSARIAL_ESCALATION
    },
    {
      name: "cost_not_mislabeled_attack",
      input: { code: "cost_hard_limit" },
      expectPrimary: STRESS_CLASS_V0.COST_SPIKE,
      expectAction: RESPONSE_ACTION_V0.THROTTLE
    }
  ];

  const results = scenarios.map((s) => {
    const t = classifyStressResponseV0(s.input);
    const okPrimary = t.stressClass === s.expectPrimary;
    const okAction = s.expectAction == null || t.responseAction === s.expectAction;
    const okStrict =
      s.expectActionStrict == null || t.responseActionStrict === s.expectActionStrict;
    const okSoft =
      s.expectActionSoftened == null || t.actionSoftened === s.expectActionSoftened;
    const okSec =
      s.expectSecondary == null ||
      JSON.stringify(t.stressSecondary) === JSON.stringify(s.expectSecondary);
    const okRes = s.expectResolution == null || t.conflictResolution === s.expectResolution;
    return {
      name: s.name,
      pass: okPrimary && okAction && okStrict && okSoft && okSec && okRes,
      got: {
        stressClass: t.stressClass,
        responseAction: t.responseAction,
        responseActionStrict: t.responseActionStrict,
        actionSoftened: t.actionSoftened,
        stressSecondary: t.stressSecondary,
        conflictResolution: t.conflictResolution,
        stressConfidence: t.stressConfidence,
        actionConfidence: t.actionConfidence
      }
    };
  });

  return {
    pass: results.every((r) => r.pass),
    scenarios: results
  };
}

/**
 * Attach taxonomy to Error for HTTP layer.
 * @param {Error} err
 * @param {ReturnType<typeof classifyStressResponseV0>} taxonomy
 */
export function attachStressTaxonomyToErrorV0(err, taxonomy) {
  if (!err || typeof err !== "object") return err;
  err.stressClass = taxonomy.stressClass;
  err.responseAction = taxonomy.responseAction;
  err.stressMatrix = taxonomy.matrix;
  err.stressInterpretable = taxonomy.interpretable;
  err.stressConfidence = taxonomy.stressConfidence;
  err.actionConfidence = taxonomy.actionConfidence;
  err.actionSoftened = taxonomy.actionSoftened;
  err.actionBorderline = taxonomy.actionBorderline;
  err.userFacingAction = taxonomy.userFacingAction;
  err.responseActionStrict = taxonomy.responseActionStrict;
  err.actionInterpretable = taxonomy.actionInterpretable;
  err.conflictResolution = taxonomy.conflictResolution;
  err.stressSecondary = taxonomy.stressSecondary;
  err.responseActions = taxonomy.responseActions;
  if (!err.reply && taxonomy.userMessageTr) err.reply = taxonomy.userMessageTr;
  return err;
}
