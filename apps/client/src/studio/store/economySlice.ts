import type { CausalEconomyLayerState } from "../types/rskOntology";
import { defaultCausalEconomy } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

/** Operator / policy: set or clear economy caps (undefined clears a cap). */
export function patchCausalEconomy(partial: Partial<CausalEconomyLayerState>): void {
  const s = getStudioKernelState();
  const base = s.causalEconomy ?? defaultCausalEconomy();
  setStudioKernelState({
    ...s,
    causalEconomy: { ...base, ...partial }
  });
}
