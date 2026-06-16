import { resolveEntityRuntimeV1 } from "./rhizohEntityRegistryV1.js";
import { RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1 } from "./sovereignWorldMapNodesV0.js";
import {
  dispatchSpiralMMOAwakeningStagedV0
} from "./worldMapMeaningfulTransitionV0.js";
import { resolveWorldSpaceMediaChannelForMapNodeV0 } from "./worldSpaceMediaChannelsV0.js";
import {
  ORCHESTRATOR_ACTION_REGISTRY_V0,
  RHIZOH_OPEN_CASTLE_EVENT_V1,
  RHIZOH_OPEN_CHESS_ARENA_EVENT_V1,
  RHIZOH_OPEN_LIBRARY_EVENT_V1,
  RHIZOH_OPEN_TOWER_PORTAL_EVENT_V1,
  RHIZOH_OPEN_WORKSPACE_EVENT_V1,
  RHIZOH_SHOW_INFO_EVENT_V1,
  RHIZOH_V11_MAP_INTENT_EVENT_V0,
  SYMBYO_MAP_INTENT_TYPE_V0
} from "./symbyoMapIntentBridgeV0.js";

let orchestratorAttachedV1 = false;

/**
 * Map intent → workspace / castle execution (V11 primary surface).
 * Listens on rhizoh:v11-map-intent-v0 (window + document).
 */
export function attachRhizohMapExecutionOrchestratorV1() {
  if (typeof window === "undefined" || orchestratorAttachedV1) return;
  orchestratorAttachedV1 = true;

  const onMapIntent = (e) => {
    const detail = e?.detail;
    const decision = detail?.normalizedDecision?.decision;
    const node = detail?.nodeView;
    if (!decision || !node) return;
    if (detail?.intent?.intent !== SYMBYO_MAP_INTENT_TYPE_V0.ENTER_NODE) return;

    const runtime = resolveEntityRuntimeV1(node);

    switch (decision) {
      case ORCHESTRATOR_ACTION_REGISTRY_V0.ENTER_CASTLE:
        window.dispatchEvent(
          new CustomEvent(RHIZOH_OPEN_CASTLE_EVENT_V1, {
            detail: Object.freeze({ node, runtime, routed: detail })
          })
        );
        break;

      case ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_WORKSPACE:
        window.dispatchEvent(
          new CustomEvent(RHIZOH_OPEN_WORKSPACE_EVENT_V1, {
            detail: Object.freeze({ node, runtime, routed: detail, workspace: true })
          })
        );
        break;

      case ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_LIBRARY:
        window.dispatchEvent(
          new CustomEvent(RHIZOH_OPEN_LIBRARY_EVENT_V1, {
            detail: Object.freeze({ node, runtime, routed: detail })
          })
        );
        break;

      case ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_CHESS_ARENA:
        window.dispatchEvent(
          new CustomEvent(RHIZOH_OPEN_CHESS_ARENA_EVENT_V1, {
            detail: Object.freeze({ node, runtime, routed: detail })
          })
        );
        break;

      case ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_TOWER_PORTAL:
        window.dispatchEvent(
          new CustomEvent(RHIZOH_OPEN_TOWER_PORTAL_EVENT_V1, {
            detail: Object.freeze({ node, runtime, routed: detail })
          })
        );
        break;

      case ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_MEDIA_PLAYER: {
        const source = `map:node:${String(node.id || "unknown")}`;
        window.dispatchEvent(
          new CustomEvent(RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1, {
            detail: Object.freeze({
              node,
              runtime,
              routed: detail,
              title: node.name || node.label,
              source,
              initialChannelId: resolveWorldSpaceMediaChannelForMapNodeV0(node)
            })
          })
        );
        break;
      }

      case ORCHESTRATOR_ACTION_REGISTRY_V0.ATTACH_VOICE_STREAM:
        window.dispatchEvent(
          new CustomEvent(RHIZOH_OPEN_WORKSPACE_EVENT_V1, {
            detail: Object.freeze({ node, runtime, routed: detail, voiceStream: true })
          })
        );
        break;

      case ORCHESTRATOR_ACTION_REGISTRY_V0.OPEN_SPIRAL_MMO: {
        const leafletMap =
          typeof window !== "undefined" ? window.__rhizoh?.v11LeafletMap || null : null;
        dispatchSpiralMMOAwakeningStagedV0(String(node.id || ""), leafletMap);
        break;
      }

      case ORCHESTRATOR_ACTION_REGISTRY_V0.LOAD_WORLD_NODE:
      default:
        window.dispatchEvent(
          new CustomEvent(RHIZOH_SHOW_INFO_EVENT_V1, {
            detail: Object.freeze({ node, runtime, routed: detail })
          })
        );
        break;
    }
  };

  window.addEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, onMapIntent);
  document.addEventListener(RHIZOH_V11_MAP_INTENT_EVENT_V0, onMapIntent);
}

export function resetRhizohMapExecutionOrchestratorForTestV1() {
  orchestratorAttachedV1 = false;
}
