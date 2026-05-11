/**
 * RBL-D1 — minimal executable divergence classification (closed enum).
 * @see docs/RBL_D1_DIVERGENCE_SEMANTICS_ENGINE_V1.md
 *
 * Input is **feature-tagged** (witness relation, π-split class, epoch fork);
 * no inference beyond deterministic priority order.
 */

/** @typedef {{ piA?: string; piB?: string; epochA?: string; epochB?: string }} DivergenceScope */

/**
 * Closed V-CLASS / divergence surface — runtime must not invent values.
 * @type {Readonly<{
 *   W_INDEPENDENT: string;
 *   W_EXCLUSIVE: string;
 *   W_VOID: string;
 *   PI_SPLIT_NON_BREAKING: string;
 *   PI_SPLIT_BREAKING: string;
 *   PI_SPLIT_INCOMPARABLE: string;
 *   EPOCH_FORK: string;
 *   NONE: string;
 *   UNKNOWN: string;
 * }>}
 */
export const DIVERGENCE_CLASS = Object.freeze({
  W_INDEPENDENT: "W_INDEPENDENT",
  W_EXCLUSIVE: "W_EXCLUSIVE",
  W_VOID: "W_VOID",
  PI_SPLIT_NON_BREAKING: "PI_SPLIT_NON_BREAKING",
  PI_SPLIT_BREAKING: "PI_SPLIT_BREAKING",
  PI_SPLIT_INCOMPARABLE: "PI_SPLIT_INCOMPARABLE",
  EPOCH_FORK: "EPOCH_FORK",
  NONE: "DIVERGENCE_NONE",
  UNKNOWN: "DIVERGENCE_UNKNOWN"
});

/**
 * Priority: epoch fork → π split → witness relation → explicit none → unknown.
 *
 * @param {{
 *   witnessRelation?: "INDEPENDENT"|"EXCLUSIVE"|"VOID";
 *   piSplitClass?: "NON_BREAKING"|"BREAKING"|"INCOMPARABLE";
 *   epochFork?: boolean;
 *   explicitNone?: boolean;
 *   piA?: string;
 *   piB?: string;
 *   epochA?: string;
 *   epochB?: string;
 * } | undefined} features
 * @returns {{ divergenceClass: string; witness: { features: Record<string, unknown> }; scope: DivergenceScope }}
 */
export function classifyDivergence(features) {
  const f = features && typeof features === "object" ? features : {};
  /** @type {Record<string, unknown>} */
  const featCopy = {};
  for (const k of Object.keys(f)) {
    featCopy[k] = f[/** @type {keyof typeof f} */ (k)];
  }
  const witness = { features: featCopy };

  /** @type {DivergenceScope} */
  const scope = {};
  if (typeof f.piA === "string") {
    scope.piA = f.piA;
  }
  if (typeof f.piB === "string") {
    scope.piB = f.piB;
  }
  if (typeof f.epochA === "string") {
    scope.epochA = f.epochA;
  }
  if (typeof f.epochB === "string") {
    scope.epochB = f.epochB;
  }

  if (f.epochFork === true) {
    return { divergenceClass: DIVERGENCE_CLASS.EPOCH_FORK, witness, scope };
  }

  const pi = f.piSplitClass;
  if (pi === "INCOMPARABLE") {
    return { divergenceClass: DIVERGENCE_CLASS.PI_SPLIT_INCOMPARABLE, witness, scope };
  }
  if (pi === "BREAKING") {
    return { divergenceClass: DIVERGENCE_CLASS.PI_SPLIT_BREAKING, witness, scope };
  }
  if (pi === "NON_BREAKING") {
    return { divergenceClass: DIVERGENCE_CLASS.PI_SPLIT_NON_BREAKING, witness, scope };
  }

  const wr = f.witnessRelation;
  if (wr === "EXCLUSIVE") {
    return { divergenceClass: DIVERGENCE_CLASS.W_EXCLUSIVE, witness, scope };
  }
  if (wr === "VOID") {
    return { divergenceClass: DIVERGENCE_CLASS.W_VOID, witness, scope };
  }
  if (wr === "INDEPENDENT") {
    return { divergenceClass: DIVERGENCE_CLASS.W_INDEPENDENT, witness, scope };
  }

  if (f.explicitNone === true) {
    return { divergenceClass: DIVERGENCE_CLASS.NONE, witness, scope };
  }

  return { divergenceClass: DIVERGENCE_CLASS.UNKNOWN, witness, scope };
}
