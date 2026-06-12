export const RHIZOH_ENTITY_TYPE_V1 = Object.freeze({
  CASTLE: "castle",
  TOWER: "tower",
  GHOST: "ghost",
  CORE: "core"
});

export const RHIZOH_TOWER_WORKSPACES_V1 = Object.freeze({
  gemini_tower: {
    workspaceId: "gemini_workspace_v1",
    capabilities: ["ai_chat", "code_lab", "memory_view"]
  },

  claude_tower: {
    workspaceId: "claude_workspace_v1",
    capabilities: ["analysis_lab", "doc_reasoning"]
  },

  chatgpt_tower: {
    workspaceId: "openai_workspace_v1",
    capabilities: ["chat_shell", "tools", "memory_bridge"]
  },

  deepmind_tower: {
    workspaceId: "deepmind_workspace_v1",
    capabilities: ["research_simulation"]
  }
});

export function resolveEntityRuntimeV1(node) {
  if (!node) return null;

  if (node.type === "tower") {
    return RHIZOH_TOWER_WORKSPACES_V1[node.id] || null;
  }

  if (node.type === "castle") {
    return {
      workspaceId: `castle_${node.id}`,
      capabilities: ["media_player", "room_system", "inventory"]
    };
  }

  return null;
}
