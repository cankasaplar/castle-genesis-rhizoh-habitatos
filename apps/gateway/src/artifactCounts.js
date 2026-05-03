/**
 * AppNext / Rhizoh ile uyumlu: artifacts/{appId}/public/data/{agents|commands|reality_events}
 * Tanılama için üst sınırlı okuma (Hosting kotası / maliyet için prod'da sık çağrımayın).
 */
const CAP = 800;

export async function countArtifactLayerDocuments(db, appId) {
  const id = String(appId || "").trim();
  if (!db || !id) {
    return { agents: 0, commands: 0, realityEvents: 0, total: 0, capped: false };
  }
  const base = db.collection("artifacts").doc(id).collection("public").doc("data");
  try {
    const [agentsSnap, commandsSnap, realitySnap] = await Promise.all([
      base.collection("agents").limit(CAP).get(),
      base.collection("commands").limit(CAP).get(),
      base.collection("reality_events").limit(CAP).get()
    ]);
    const agents = agentsSnap.size;
    const commands = commandsSnap.size;
    const realityEvents = realitySnap.size;
    const total = agents + commands + realityEvents;
    const capped = agents >= CAP || commands >= CAP || realityEvents >= CAP;
    return { agents, commands, realityEvents, total, capped };
  } catch {
    return { agents: 0, commands: 0, realityEvents: 0, total: 0, capped: false, error: "artifact_count_failed" };
  }
}
