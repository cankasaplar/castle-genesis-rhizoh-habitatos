export type EntityID = string;
export type ObservationID = string;
export type EventID = string;
export type Timestamp = number;

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface Confidence {
    value: number;
    weight: number;
}

export interface Action {
    id: string;
    type: string;
    payload: Record<string, unknown>;
}

export interface Decision {
    action: Action;
    rationale: string;
    confidence: Confidence;
}

export interface Observation {
    id: ObservationID;
    actorId: EntityID;
    payload: Record<string, unknown>;
    observedAt: Timestamp;
}

export interface EventEnvelope {
    id: EventID;
    type: string;
    payload: Record<string, unknown>;
    createdAt: Timestamp;
}

export function createAction(type: string, payload: Record<string, unknown> = {}, id = `action:${Date.now()}`): Action {
    return { id, type, payload };
}

export function createConfidence(value: number, weight = 1): Confidence {
    return {
        value: Math.min(1, Math.max(0, value)),
        weight: Math.max(0, weight),
    };
}

export function createDecision(action: Action, rationale: string, confidence?: Confidence): Decision {
    return {
        action,
        rationale,
        confidence: confidence ?? createConfidence(0.5, 1),
    };
}

export function createVector3(x = 0, y = 0, z = 0): Vector3 {
    return { x, y, z };
}
