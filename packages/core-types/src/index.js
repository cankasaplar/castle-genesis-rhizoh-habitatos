/**
 * Rhizoh Epistemic & Spatial Core Types (L10)
 *
 * This package is intentionally dependency-free and forms the semantic
 * foundation for all higher-level runtime and simulation packages.
 */

export const DEFAULT_CONFIDENCE = Object.freeze({ value: 0.5, weight: 1 });

export function clampConfidence(value) {
    return Math.min(1, Math.max(0, value));
}

export function createAction(type, payload = {}, id = `action:${Date.now()}`) {
    return {
        id,
        type,
        payload,
    };
}

export function createConfidence(value, weight = 1) {
    return {
        value: clampConfidence(value),
        weight: Math.max(0, weight),
    };
}

export function createDecision(action, rationale, confidence) {
    return {
        action,
        rationale,
        confidence: confidence ?? createConfidence(DEFAULT_CONFIDENCE.value, DEFAULT_CONFIDENCE.weight),
    };
}

export function createVector3(x = 0, y = 0, z = 0) {
    return { x, y, z };
}

export function createObservation(id, actorId, payload = {}) {
    return {
        id,
        actorId,
        payload,
        observedAt: Date.now(),
    };
}

export function createEvent(id, type, payload = {}) {
    return {
        id,
        type,
        payload,
        createdAt: Date.now(),
    };
}
