# Realtime World Architecture

## Data Flow

1. Client komut metni yollar (`COMMAND_TEXT`)
2. Gateway metni `command-dsl` ile canonical komuta cevirir
3. Orchestrator canonical komutu authoritative `sim-core` uzerinde uygular
4. Gateway her tickte authoritative world state'i tum clientlara yayinlar
5. Client sadece render eder (single source of truth = server world)

## Neden authoritative?

- Tum istemciler ayni durumu gorur
- Desync olasiligi azalir
- Client tarafli exploit etkisi sinirlanir

## Gercek Dunya Haritasi Katmani

Harita katmani world verisini `lat/lng` koordinati olarak alir ve 3D globe yuzeyine projekte eder:

- Castle'lar -> sabit node
- Agent'lar -> castle etrafinda dinamik orbit noktasi

Bu yapi daha sonra:

- geofence eventleri
- bolgesel shard gecisleri
- canli yayin odalari

icin genisletilebilir.
