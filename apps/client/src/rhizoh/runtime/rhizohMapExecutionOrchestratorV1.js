import { resolveEntityRuntimeV1 } from "./rhizohEntityRegistryV1.js";

export function attachRhizohMapExecutionOrchestratorV1() {
  if (typeof window === "undefined") return;

  window.addEventListener("RHIZOH_V11_MAP_INTENT_V0", (e) => {
    const decision = e.detail?.normalizedDecision;
    const node = e.detail?.nodeView;

    if (!decision || !node) return;

    const runtime = resolveEntityRuntimeV1(node);

    switch (decision.action) {
      case "OPEN_CASTLE":
        window.dispatchEvent(new CustomEvent("RHIZOH_OPEN_CASTLE", {
          detail: { node, runtime }
        }));
        break;

      case "OPEN_TOWER_WORKSPACE":
        window.dispatchEvent(new CustomEvent("RHIZOH_OPEN_WORKSPACE", {
          detail: { node, runtime }
        }));
        break;

      case "SHOW_INFO":
        window.dispatchEvent(new CustomEvent("RHIZOH_SHOW_INFO", {
          detail: { node, runtime }
        }));
        break;
    }
  });
}
