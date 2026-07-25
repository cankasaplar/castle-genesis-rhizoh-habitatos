/**
 * First ontology primitives for actors and nodes.
 */

export function createActor(id, kind = 'actor', metadata = {}) {
    return {
        id,
        kind,
        metadata,
        type: 'actor',
    };
}

export function createNode(id, position = { x: 0, y: 0, z: 0 }, metadata = {}) {
    return {
        id,
        kind: 'node',
        position,
        metadata,
        type: 'node',
    };
}
