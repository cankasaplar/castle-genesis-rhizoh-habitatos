const CASTLES = [
  { id: "castle-01", name: "Zion Core", lat: 41.0082, lng: 28.9784 },
  { id: "castle-02", name: "Training Ground", lat: 35.6895, lng: 139.6917 },
  { id: "castle-03", name: "Studio Broadcast", lat: 40.7128, lng: -74.006 }
];

const STATE_ACTIVE = 1;
const STATE_LOW_POWER = 2;
const FIXED_DT = 1 / 60;
const CAPACITY = 4096;
const ENTITY_CAPACITY = 2048;

function mulberry32(seedInt) {
  let t = seedInt >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSimulationCore(seed = "rhizoh-seed") {
  const rng = mulberry32(hashSeed(seed));
  let tick = 0;
  let simTime = 0;
  let accumulator = 0;
  let lastStepMs = Date.now();
  let nextEntity = 1;
  let count = 0;
  let entityCount = 0;

  // Struct-of-arrays ECS storage
  const entityId = new Uint32Array(CAPACITY);
  const posX = new Float32Array(CAPACITY);
  const posY = new Float32Array(CAPACITY);
  const posZ = new Float32Array(CAPACITY);
  const velX = new Float32Array(CAPACITY);
  const velY = new Float32Array(CAPACITY);
  const velZ = new Float32Array(CAPACITY);
  const battery = new Float32Array(CAPACITY);
  const state = new Uint8Array(CAPACITY);
  const version = new Uint32Array(CAPACITY);
  const castleIdx = new Uint8Array(CAPACITY);
  const mapEntityId = new Uint32Array(ENTITY_CAPACITY);
  const entityPosX = new Float32Array(ENTITY_CAPACITY);
  const entityPosY = new Float32Array(ENTITY_CAPACITY);
  const entityPosZ = new Float32Array(ENTITY_CAPACITY);
  const entityType = new Uint8Array(ENTITY_CAPACITY); // 1 node, 2 beacon, 3 relic
  const entityVersion = new Uint32Array(ENTITY_CAPACITY);
  const entityCastleIdx = new Uint8Array(ENTITY_CAPACITY);

  const byEntity = new Map();

  function addAgent(targetCastleId = "castle-01") {
    if (count >= CAPACITY) return null;
    const idx = count;
    const castleIndex = Math.max(0, CASTLES.findIndex((c) => c.id === targetCastleId));
    const idNum = nextEntity++;
    entityId[idx] = idNum;
    castleIdx[idx] = castleIndex;
    posX[idx] = (rng() - 0.5) * 1000;
    posY[idx] = (rng() - 0.5) * 1000;
    posZ[idx] = (rng() - 0.5) * 1000;
    velX[idx] = (rng() - 0.5) * 6;
    velY[idx] = (rng() - 0.5) * 6;
    velZ[idx] = (rng() - 0.5) * 6;
    battery[idx] = 90 + rng() * 10;
    state[idx] = STATE_ACTIVE;
    version[idx] = 0;
    byEntity.set(idNum, idx);
    count += 1;
    return { id: `AGT-${String(idNum).padStart(3, "0")}`, castleId: CASTLES[castleIndex].id };
  }

  function addEntity(targetCastleId = "castle-01", typeName = "NODE") {
    if (entityCount >= ENTITY_CAPACITY) return null;
    const idx = entityCount;
    const castleIndex = Math.max(0, CASTLES.findIndex((c) => c.id === targetCastleId));
    const idNum = nextEntity++;
    entityId[idx] = idNum;
    entityCastleIdx[idx] = castleIndex;
    entityPosX[idx] = (rng() - 0.5) * 1400;
    entityPosY[idx] = (rng() - 0.5) * 1400;
    entityPosZ[idx] = (rng() - 0.5) * 1400;
    entityType[idx] = typeName === "BEACON" ? 2 : typeName === "RELIC" ? 3 : 1;
    entityVersion[idx] = 0;
    entityCount += 1;
    return { id: `ENT-${String(idNum).padStart(3, "0")}`, castleId: CASTLES[castleIndex].id, type: typeName };
  }

  function createCastle(name = `CASTLE-${Date.now().toString().slice(-4)}`, opts = {}) {
    const id = `castle-${String(CASTLES.length + 1).padStart(2, "0")}`;
    const lat = Number.isFinite(opts.lat) ? opts.lat : 30 + rng() * 30;
    const lng = Number.isFinite(opts.lng) ? opts.lng : -120 + rng() * 240;
    CASTLES.push({
      id,
      name,
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4)),
      weather: opts.weather || null,
      traffic: opts.traffic || null
    });
    return { id, name, lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)), weather: opts.weather || null, traffic: opts.traffic || null };
  }

  // seed entities
  for (let i = 0; i < 24; i += 1) addAgent(CASTLES[i % CASTLES.length].id);

  function physicsSystem(dt) {
    for (let i = 0; i < count; i += 1) {
      posX[i] += velX[i] * dt * 60;
      posY[i] += velY[i] * dt * 60;
      posZ[i] += velZ[i] * dt * 60;
    }
  }

  function gravitySystem(dt) {
    for (let i = 0; i < count; i += 1) {
      const dx = -posX[i];
      const dy = -posY[i];
      const dz = -posZ[i];
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < 1e-5) continue;
      const dist = Math.sqrt(distSq);
      const pull = Math.min(0.4, dist * 0.0006);
      velX[i] += (dx / dist) * pull * dt * 60;
      velY[i] += (dy / dist) * pull * dt * 60;
      velZ[i] += (dz / dist) * pull * dt * 60;
    }
  }

  function dampingSystem() {
    for (let i = 0; i < count; i += 1) {
      velX[i] *= 0.99;
      velY[i] *= 0.99;
      velZ[i] *= 0.99;
      battery[i] = Math.max(0, battery[i] - 0.003);
      state[i] = battery[i] <= 10 ? STATE_LOW_POWER : STATE_ACTIVE;
    }
  }

  function validationSystem() {
    for (let i = 0; i < count; i += 1) {
      if (!Number.isFinite(posX[i]) || !Number.isFinite(posY[i]) || !Number.isFinite(posZ[i])) {
        posX[i] = 0;
        posY[i] = 0;
        posZ[i] = 0;
        velX[i] = 0;
        velY[i] = 0;
        velZ[i] = 0;
      }
      const speedSq = velX[i] * velX[i] + velY[i] * velY[i] + velZ[i] * velZ[i];
      if (speedSq > 2500) {
        const inv = 50 / Math.sqrt(speedSq);
        velX[i] *= inv;
        velY[i] *= inv;
        velZ[i] *= inv;
      }
      version[i] += 1;
    }
    for (let i = 0; i < entityCount; i += 1) {
      if (!Number.isFinite(entityPosX[i]) || !Number.isFinite(entityPosY[i]) || !Number.isFinite(entityPosZ[i])) {
        entityPosX[i] = 0;
        entityPosY[i] = 0;
        entityPosZ[i] = 0;
      }
      entityVersion[i] += 1;
    }
  }

  function runFixedStep(dt) {
    gravitySystem(dt);
    physicsSystem(dt);
    dampingSystem();
    validationSystem();
    tick += 1;
    simTime += dt;
  }

  function step(deltaTime) {
    const nowMs = Date.now();
    const dtReal = typeof deltaTime === "number" ? deltaTime : (nowMs - lastStepMs) / 1000;
    lastStepMs = nowMs;
    accumulator += Math.max(0, Math.min(dtReal, 0.25));
    while (accumulator >= FIXED_DT) {
      runFixedStep(FIXED_DT);
      accumulator -= FIXED_DT;
    }
  }

  function spawnAgent(targetCastleId = "castle-01") {
    return addAgent(targetCastleId);
  }

  function spawnEntity(targetCastleId = "castle-01", entityKind = "NODE") {
    return addEntity(targetCastleId, entityKind);
  }

  function getWorldSnapshot() {
    const castles = CASTLES.map((c) => ({ ...c, energy: 1000 }));
    const agents = [];
    const entities = [];
    const perCastleCount = new Array(CASTLES.length).fill(0);
    const perCastleBattery = new Array(CASTLES.length).fill(0);

    for (let i = 0; i < count; i += 1) {
      const cIdx = castleIdx[i];
      perCastleCount[cIdx] += 1;
      perCastleBattery[cIdx] += battery[i];
      agents.push({
        id: `AGT-${String(entityId[i]).padStart(3, "0")}`,
        castleId: CASTLES[cIdx].id,
        state: state[i] === STATE_LOW_POWER ? "LOW_POWER" : "ACTIVE",
        battery: Number(battery[i].toFixed(1)),
        pos: [Number(posX[i].toFixed(2)), Number(posY[i].toFixed(2)), Number(posZ[i].toFixed(2))],
        vel: [Number(velX[i].toFixed(2)), Number(velY[i].toFixed(2)), Number(velZ[i].toFixed(2))],
        v: version[i]
      });
    }

    for (let i = 0; i < entityCount; i += 1) {
      const cIdx = entityCastleIdx[i];
      entities.push({
        id: `ENT-${String(mapEntityId[i]).padStart(3, "0")}`,
        castleId: CASTLES[cIdx].id,
        type: entityType[i] === 2 ? "BEACON" : entityType[i] === 3 ? "RELIC" : "NODE",
        pos: [Number(entityPosX[i].toFixed(2)), Number(entityPosY[i].toFixed(2)), Number(entityPosZ[i].toFixed(2))],
        v: entityVersion[i]
      });
    }

    const castleSnapshots = castles.map((c, i) => ({
      ...c,
      agentCount: perCastleCount[i],
      avgBattery: perCastleCount[i] === 0 ? 100 : Number((perCastleBattery[i] / perCastleCount[i]).toFixed(1))
    }));

    return {
      seed,
      tick,
      time: Number(simTime.toFixed(3)),
      fixedDt: FIXED_DT,
      castles: castleSnapshots,
      agents,
      entities
    };
  }

  return { step, spawnAgent, spawnEntity, createCastle, getWorldSnapshot, fixedDt: FIXED_DT };
}
