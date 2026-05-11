/**
 * HOGA-1 — MetaΔ composition + ECPT path closure (reference kernel).
 * @see docs/ECER_ADV_HOGA_1_HIGHER_ORDER_GOVERNANCE_ALGEBRA.md
 *
 *   node scripts/hogaComposition.mjs
 *   npm run epistemic:hoga-verify
 */

import { pathToFileURL } from "node:url";

export const HOGA_VERSION = "HOGA_1_0";

export const HOGA_ERR = Object.freeze({
  COMPOSITION_UNDEFINED: "HOGA_ERR_COMPOSITION_UNDEFINED",
  META_INCOMPATIBLE: "HOGA_ERR_META_INCOMPATIBLE",
  ECPT_PATH_NOT_CLOSED: "HOGA_ERR_ECPT_PATH_NOT_CLOSED",
  ORDER_SENSITIVE_UNWITNESSED: "HOGA_ERR_ORDER_SENSITIVE_UNWITNESSED",
  ECPT_HIDDEN_INTERMEDIATE: "HOGA_ERR_ECPT_HIDDEN_INTERMEDIATE"
});

export const CONFLICT_SIGNATURE = Object.freeze({
  COMMUTE: "COMMUTE",
  ORDER_SENSITIVE: "ORDER_SENSITIVE",
  INCOMPATIBLE: "INCOMPATIBLE",
  AMBIGUOUS: "AMBIGUOUS"
});

/** @typedef {{ id: string }} MetaChangeRef */

/**
 * Ordered composition registry: MetaΔ_a ∘ MetaΔ_b (apply a, then b on rule space).
 * Unknown ordered pair ⇒ AMBIGUOUS + COMPOSITION_UNDEFINED (HOGA-I0 fail-closed).
 */
const ORDERED_COMPOSITION = [
  {
    first: "META_J_COMMUTE_A",
    second: "META_J_COMMUTE_B",
    signature: CONFLICT_SIGNATURE.COMMUTE
  },
  {
    first: "META_J_COMMUTE_B",
    second: "META_J_COMMUTE_A",
    signature: CONFLICT_SIGNATURE.COMMUTE
  },
  {
    first: "META_ORDER_FIRST",
    second: "META_ORDER_SECOND",
    signature: CONFLICT_SIGNATURE.ORDER_SENSITIVE
  },
  {
    first: "META_INCOMPAT_A",
    second: "META_INCOMPAT_B",
    signature: CONFLICT_SIGNATURE.INCOMPATIBLE
  }
];

/**
 * @param {Set<string>|string[]|undefined} edges
 */
function toEdgeSet(edges) {
  if (!edges) return new Set();
  if (edges instanceof Set) return edges;
  return new Set(edges);
}

/**
 * @param {MetaChangeRef} metaA
 * @param {MetaChangeRef} metaB
 * @param {{ compositionWitnessRef?: string | null }} [ctx]
 */
export function composeMetaDelta(metaA, metaB, ctx = {}) {
  const witness = ctx.compositionWitnessRef;
  const row = ORDERED_COMPOSITION.find(
    (r) => r.first === metaA.id && r.second === metaB.id
  );
  /** @type {string[]} */
  const errors = [];
  const compositeId = `${metaA.id}∘${metaB.id}`;

  if (!row) {
    errors.push(HOGA_ERR.COMPOSITION_UNDEFINED);
    return {
      ok: false,
      signature: CONFLICT_SIGNATURE.AMBIGUOUS,
      errors,
      compositeId,
      hogaVersion: HOGA_VERSION
    };
  }

  if (row.signature === CONFLICT_SIGNATURE.INCOMPATIBLE) {
    errors.push(HOGA_ERR.META_INCOMPATIBLE);
    return {
      ok: false,
      signature: row.signature,
      errors,
      compositeId,
      hogaVersion: HOGA_VERSION
    };
  }

  if (row.signature === CONFLICT_SIGNATURE.ORDER_SENSITIVE) {
    if (witness == null || String(witness).trim() === "") {
      errors.push(HOGA_ERR.ORDER_SENSITIVE_UNWITNESSED);
      return {
        ok: false,
        signature: row.signature,
        errors,
        compositeId,
        hogaVersion: HOGA_VERSION
      };
    }
  }

  return {
    ok: true,
    signature: row.signature,
    errors,
    compositeId,
    hogaVersion: HOGA_VERSION
  };
}

/**
 * ECPT path: consecutive phases must appear as directed edges "FROM>TO".
 * @param {{
 *   path: string[];
 *   edges: Set<string> | string[];
 *   forbiddenMiddles?: { from: string; forbiddenMiddle: string; to: string }[];
 *   requiredClosureEdges?: Set<string> | string[];
 * }} opts
 */
export function verifyEcptPathClosed(opts) {
  const path = opts.path;
  const edges = toEdgeSet(opts.edges);
  /** @type {string[]} */
  const errors = [];

  if (!Array.isArray(path) || path.length < 2) {
    errors.push(HOGA_ERR.ECPT_PATH_NOT_CLOSED);
    return { ok: false, errors };
  }

  for (let i = 0; i < path.length - 1; i++) {
    const e = `${path[i]}>${path[i + 1]}`;
    if (!edges.has(e)) {
      errors.push(HOGA_ERR.ECPT_PATH_NOT_CLOSED);
      return { ok: false, errors, failedEdge: e };
    }
  }

  if (opts.forbiddenMiddles && path.length === 3) {
    const [a, b, c] = path;
    for (const rule of opts.forbiddenMiddles) {
      if (
        rule.from === a &&
        rule.forbiddenMiddle === b &&
        rule.to === c
      ) {
        errors.push(HOGA_ERR.ECPT_HIDDEN_INTERMEDIATE);
        return { ok: false, errors };
      }
    }
  }

  if (opts.requiredClosureEdges) {
    const closure = `${path[0]}>${path[path.length - 1]}`;
    const req = toEdgeSet(opts.requiredClosureEdges);
    if (!req.has(closure)) {
      errors.push(HOGA_ERR.ECPT_PATH_NOT_CLOSED);
      return { ok: false, errors, missingClosure: closure };
    }
  }

  return { ok: true, errors: [] };
}

export function runHogaSmoke() {
  const c = composeMetaDelta(
    { id: "META_J_COMMUTE_A" },
    { id: "META_J_COMMUTE_B" },
    {}
  );
  if (!c.ok || c.signature !== CONFLICT_SIGNATURE.COMMUTE) {
    throw new Error("HOGA_SMOKE_FAIL: commute");
  }

  const bad = composeMetaDelta(
    { id: "META_INCOMPAT_A" },
    { id: "META_INCOMPAT_B" },
    {}
  );
  if (bad.ok || !bad.errors.includes(HOGA_ERR.META_INCOMPATIBLE)) {
    throw new Error("HOGA_SMOKE_FAIL: incompatible");
  }

  const ordNo = composeMetaDelta(
    { id: "META_ORDER_FIRST" },
    { id: "META_ORDER_SECOND" },
    {}
  );
  if (ordNo.ok || !ordNo.errors.includes(HOGA_ERR.ORDER_SENSITIVE_UNWITNESSED)) {
    throw new Error("HOGA_SMOKE_FAIL: order witness required");
  }

  const ordOk = composeMetaDelta(
    { id: "META_ORDER_FIRST" },
    { id: "META_ORDER_SECOND" },
    { compositionWitnessRef: "W:order-pair" }
  );
  if (!ordOk.ok || ordOk.signature !== CONFLICT_SIGNATURE.ORDER_SENSITIVE) {
    throw new Error("HOGA_SMOKE_FAIL: order witnessed");
  }

  const unk = composeMetaDelta({ id: "META_UNKNOWN_X" }, { id: "META_UNKNOWN_Y" }, {});
  if (unk.ok || !unk.errors.includes(HOGA_ERR.COMPOSITION_UNDEFINED)) {
    throw new Error("HOGA_SMOKE_FAIL: unknown pair");
  }

  const revOrder = composeMetaDelta(
    { id: "META_ORDER_SECOND" },
    { id: "META_ORDER_FIRST" },
    { compositionWitnessRef: "W:ignored" }
  );
  if (revOrder.ok || !revOrder.errors.includes(HOGA_ERR.COMPOSITION_UNDEFINED)) {
    throw new Error("HOGA_SMOKE_FAIL: reversed order-sensitive undefined");
  }

  const pOk = verifyEcptPathClosed({
    path: ["PH_REGULATED", "PH_AMENDMENT", "PH_LOCK"],
    edges: ["PH_REGULATED>PH_AMENDMENT", "PH_AMENDMENT>PH_LOCK"]
  });
  if (!pOk.ok) throw new Error("HOGA_SMOKE_FAIL: ecpt path");

  const pBad = verifyEcptPathClosed({
    path: ["PH_REGULATED", "PH_SKIP", "PH_LOCK"],
    edges: ["PH_REGULATED>PH_AMENDMENT", "PH_AMENDMENT>PH_LOCK"]
  });
  if (pBad.ok || !pBad.errors.includes(HOGA_ERR.ECPT_PATH_NOT_CLOSED)) {
    throw new Error("HOGA_SMOKE_FAIL: ecpt missing edge");
  }

  const hidden = verifyEcptPathClosed({
    path: ["PH_A", "PH_TRAP", "PH_C"],
    edges: ["PH_A>PH_TRAP", "PH_TRAP>PH_C"],
    forbiddenMiddles: [{ from: "PH_A", forbiddenMiddle: "PH_TRAP", to: "PH_C" }]
  });
  if (hidden.ok || !hidden.errors.includes(HOGA_ERR.ECPT_HIDDEN_INTERMEDIATE)) {
    throw new Error("HOGA_SMOKE_FAIL: hidden intermediate");
  }

  const needClosure = verifyEcptPathClosed({
    path: ["PH_A", "PH_B"],
    edges: ["PH_A>PH_B"],
    requiredClosureEdges: []
  });
  if (needClosure.ok || !needClosure.errors.includes(HOGA_ERR.ECPT_PATH_NOT_CLOSED)) {
    throw new Error("HOGA_SMOKE_FAIL: closure required");
  }

  return { ok: true, hogaVersion: HOGA_VERSION };
}

export function runHogaCli() {
  try {
    const out = runHogaSmoke();
    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(String(e && e.message ? e.message : e));
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  runHogaCli();
}
