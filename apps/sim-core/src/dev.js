import { createSimulationCore } from "./index.js";

const sim = createSimulationCore();

console.log("🚀 Deterministik Zaman Adımlı Motor başlatılıyor");
sim.start();

sim.enqueueEvent({ type: "MOVE", x: 10, y: 10, value: 1 });

setInterval(() => {
  const world = sim.getWorldSnapshot();
  console.log(`[SIM] tick=${world.tick} agents=${world.agents.length} grid(10,10)=${sim.worldGrid.get(10, 10)}`);
}, 1000);
