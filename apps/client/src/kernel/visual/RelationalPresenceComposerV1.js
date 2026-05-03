const pickPreferenceFromIntent = (intent) => {
  const text = String(intent || "").toLowerCase();
  if (text.includes("explore") || text.includes("museum")) return "immersive exploration";
  if (text.includes("broadcast") || text.includes("yayin")) return "live storytelling";
  if (text.includes("simulasyon") || text.includes("simulation")) return "scenario testing";
  return "guided creation";
};

export function composeRelationalPresenceStateV1(input) {
  const userName =
    input?.userName != null && String(input.userName).trim() !== ""
      ? String(input.userName).trim().split(/\s+/)[0]
      : null;
  const snapshot = input?.snapshot || null;
  const lastIntentRaw = input?.lastIntentRaw || "";
  const lastOutcome = input?.lastOutcome || "World Mutation";
  const recentTasks = snapshot?.recentTasks || [];

  const attention = recentTasks.slice(0, 3).map((task, idx) => ({
    agentId: task?.agentId || `RHIZOH_AGENT_${idx + 1}`,
    message:
      idx === 0
        ? "Scout agent prepared a route."
        : idx === 1
          ? "Curator agent found 3 artifacts."
          : "Builder agent is idle and waiting."
  }));

  while (attention.length < 3) {
    const idx = attention.length;
    attention.push({
      agentId: `RHIZOH_AGENT_${idx + 1}`,
      message:
        idx === 0
          ? "Scout agent prepared a route."
          : idx === 1
            ? "Curator agent found 3 artifacts."
            : "Builder agent is idle and waiting."
    });
  }

  return {
    sessionContinuity: {
      userName: userName || "",
      lastCreated: lastIntentRaw || "Museum exploration draft",
      unfinishedPaths: input?.unfinishedJourneys ?? 0,
      preference: pickPreferenceFromIntent(lastIntentRaw),
      summary: "Your world kept evolving."
    },
    relationshipIntensity: {
      systemToUser: 0.86,
      userToSystem: lastIntentRaw ? 0.9 : 0.6,
      userToAgents: attention.length ? 0.82 : 0.45,
      agentsToUser: 0.8
    },
    agentAttentionMap: attention,
    userMemoryEcho: {
      memoryLinks: input?.memoryLinks ?? 0,
      liveSignal: input?.liveSignalLabel || "Istanbul"
    },
    conversationalPresence: {
      rhizohGreeting: userName
        ? `Merhaba ${userName}. Bugun ne insa etmek istiyorsun?`
        : "Merhaba. Bugun ne insa etmek istiyorsun?",
      shortOutcome: `${lastOutcome} is ready`
    }
  };
}
