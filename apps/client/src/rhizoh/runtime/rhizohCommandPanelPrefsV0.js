/**
 * Bottom command panel — auxiliary blocks (gateway, depth, logs) default collapsed.
 */

/** v2 — T0 clean shell default; v1 key ignored (legacy expanded state cleared). */
const AUX_KEY_V1 = "rhizoh.command_panel_aux.v1";
const AUX_KEY_V2 = "rhizoh.command_panel_aux.v2";
const AUX_CHANGE_EVENT = "rhizoh:command_panel_aux";

/** @returns {boolean} */
export function isRhizohCommandPanelAuxExpandedV0() {
  if (typeof localStorage === "undefined") return false;
  try {
    if (localStorage.getItem(AUX_KEY_V2) === "1") return true;
    if (localStorage.getItem(AUX_KEY_V2) === "0") return false;
    localStorage.removeItem(AUX_KEY_V1);
    localStorage.setItem(AUX_KEY_V2, "0");
    return false;
  } catch {
    return false;
  }
}

/** @param {boolean} expanded */
export function writeRhizohCommandPanelAuxExpandedV0(expanded) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(AUX_KEY_V2, expanded ? "1" : "0");
    localStorage.removeItem(AUX_KEY_V1);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(AUX_CHANGE_EVENT));
    }
  } catch {
    /* noop */
  }
}

/** @returns {boolean} */
export function getRhizohCommandPanelAuxExpandedSnapshotV0() {
  return isRhizohCommandPanelAuxExpandedV0();
}

/** @param {() => void} onStoreChange */
export function subscribeRhizohCommandPanelAuxExpandedV0(onStoreChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  const onStorage = (e) => {
    if (e.key === AUX_KEY_V2 || e.key === null) handler();
  };
  window.addEventListener(AUX_CHANGE_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUX_CHANGE_EVENT, handler);
    window.removeEventListener("storage", onStorage);
  };
}
