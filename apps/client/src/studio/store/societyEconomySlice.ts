import { defaultSocietyEconomy } from "./initialState";
import { getStudioKernelState, setStudioKernelState } from "./internalStore";

export function patchSocietyEconomy(input: {
  avatarUid?: string;
  reputationDelta?: number;
  regionUid?: string;
  marketHeatDelta?: number;
  civicCohesionDelta?: number;
}): void {
  const s = getStudioKernelState();
  const cur = s.societyEconomy ?? defaultSocietyEconomy();
  const next = { ...cur };
  if (input.avatarUid && typeof input.reputationDelta === "number") {
    next.reputationByAvatarUid = {
      ...next.reputationByAvatarUid,
      [input.avatarUid]: (next.reputationByAvatarUid[input.avatarUid] ?? 0) + input.reputationDelta
    };
  }
  if (input.regionUid && typeof input.marketHeatDelta === "number") {
    next.marketHeatByRegionUid = {
      ...next.marketHeatByRegionUid,
      [input.regionUid]: Math.max(0, (next.marketHeatByRegionUid[input.regionUid] ?? 0) + input.marketHeatDelta)
    };
  }
  if (typeof input.civicCohesionDelta === "number") {
    next.civicCohesion = Math.max(0, Math.min(1, next.civicCohesion + input.civicCohesionDelta));
  }
  setStudioKernelState({ ...s, societyEconomy: next });
}
