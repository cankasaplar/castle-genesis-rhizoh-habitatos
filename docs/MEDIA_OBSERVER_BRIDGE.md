# MEDIA_OBSERVER_BRIDGE (Planned External Layer)

Status: `PLANNED` / `EXTERNAL-LAYER`

This document defines a lightweight bridge for media references.
It does **not** redefine Rhizoh canonical artifact semantics.

## 1) Status

Media assets are external references, not canonical artifacts.

- `.m4a` -> external asset
- `.mp4` -> external asset
- Rhizoh canonical truth -> not defined by media files

## 2) Media Observation Packet (MOP-1)

MOP-1 is a pointer packet, not an authority claim.

```json
{
  "packetType": "media-observation-pointer",
  "schemaVersion": "MOP-1",
  "mediaType": "audio",
  "title": "Rhizoh y la arquitectura de la realidad",
  "format": "m4a",
  "durationSec": 881,
  "sourcePointer": "local://Rhizoh_y_la_arquitectura_de_la_realidad.m4a",
  "importedAt": 1778280000000,
  "digest": "sha256:..."
}
```

MOP-1 guarantees:

- immutable pointer payload
- explicit media metadata
- no authority semantics
- no provenance truth-claim by itself

## 3) Optional bridge to AFOA

If an adapter is implemented, it should be one-way and explicit:

media  
-> metadata extraction  
-> MOP-1 packet  
-> adapter interpretation  
-> optional AFOA event

Event meaning must stay narrow:

- `media_ingested`: a pointer was imported
- authority: `none`

The event MUST NOT claim media as canonical truth.

## 4) Invariant

**Media may inform observation; media may never define canonical truth.**

## 5) Role separation

- NotebookLM: indexing/discovery
- media files: transport/container
- Rhizoh: canonicalization and protocol semantics

These layers may interoperate, but they are not equivalent.
