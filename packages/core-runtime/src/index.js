import { createAction, createConfidence, createDecision } from '@castle/core-types';

export class OntologicalConstraints {
    static validateRelationship(sourceType, relationship, targetType) {
        if (sourceType === 'Human' && relationship === 'owns' && targetType === 'Human') {
            return [false, 'Ontolojik İhlal: Bir insan başka bir insana ait olamaz (Human owns Human).'];
        }

        if (sourceType === 'Decision' && relationship === 'creates' && targetType === 'Past') {
            return [false, 'Ontolojik İhlal: Kararlar geçmişi geriye dönük yaratamaz veya bükemez.'];
        }

        return [true, 'Geçerli ilişki.'];
    }

    static validateAction(actionType, payload = {}) {
        if (actionType === 'TRANSFER_ASSET') {
            const amount = payload.amount ?? 0;
            if (amount <= 0) {
                return [false, 'Aksiyon İhlali: Transfer miktarı sıfır veya negatif olamaz.'];
            }
        }
        return [true, 'Geçerli aksiyon.'];
    }
}

export class Proposal {
    constructor(proposer, actionType, payload = {}, confidence = 1.0) {
        this.proposalId = `proposal:${Math.random().toString(36).slice(2, 10)}`;
        this.timestamp = Date.now();
        this.proposer = proposer;
        this.actionType = actionType;
        this.payload = payload;
        this.confidence = confidence;
    }
}

export class EpistemicEngine {
    constructor() {
        this.beliefs = new Map();
        this.agentCalibrations = new Map();
        this.explanationLog = [];
    }

    evaluateProposal(proposal) {
        const calibration = this.agentCalibrations.get(proposal.proposer) ?? 1.0;
        const calibratedConfidence = proposal.confidence * calibration;
        const target = proposal.payload?.target_asset;

        if (target && this.beliefs.get(`locked_${target}`)) {
            const explanation = `Çelişki Tespit Edildi: ${target} varlığı zaten kilitli durumdadır.`;
            this.explanationLog.push(explanation);
            this.agentCalibrations.set(proposal.proposer, Math.max(0.1, calibration - 0.15));
            return [0.0, false, explanation];
        }

        return [calibratedConfidence, true, 'Epistemik olarak tutarlı.'];
    }

    commitBelief(updates, reason) {
        Object.entries(updates).forEach(([key, value]) => this.beliefs.set(key, value));
        const explanation = `Belief Revision: [${reason}] -> ${JSON.stringify(updates)}`;
        this.explanationLog.push(explanation);
    }
}

export class ActiveConstitution {
    constructor() {
        this.rules = [ActiveConstitution._ruleMaxTransferLimit, ActiveConstitution._ruleExecutionBoundary];
    }

    evaluate(proposal, context) {
        for (const rule of this.rules) {
            const [allowed, reason] = rule(proposal, context);
            if (!allowed) {
                return [false, reason];
            }
        }
        return [true, 'Anayasal onay verildi.'];
    }

    static _ruleMaxTransferLimit(proposal, context) {
        if (proposal.actionType === 'TRANSFER_ASSET') {
            const amount = proposal.payload?.amount ?? 0;
            const maxLimit = context.maxTransferLimit ?? 10000;
            if (amount > maxLimit) {
                return [false, `Anayasal İhlal: Maksimum transfer limiti (${maxLimit}) aşıldı. Önerilen: ${amount}`];
            }
        }
        return [true, 'Limit uygun.'];
    }

    static _ruleExecutionBoundary(proposal, context) {
        const clientIsAuthority = context.clientIsCommitAuthority === true;
        if (clientIsAuthority) {
            return [false, 'Anayasal İhlal: İstemci doğrudan yürütme yetkisine (Commit Authority) sahip olamaz.'];
        }
        return [true, 'Yürütme sınırı güvende.'];
    }
}

export class RhizohExecutionRuntime {
    constructor() {
        this.epistemicEngine = new EpistemicEngine();
        this.constitution = new ActiveConstitution();
        this.truthLogV0 = [];
        this.systemContext = {
            maxTransferLimit: 5000,
            clientIsCommitAuthority: false,
        };
    }

    processExecutionProposal(proposal) {
        const confidence = createConfidence(proposal.confidence, 1);
        const [epistemicOk, epistemicMsg] = this._evaluateEpistemic(proposal);
        if (!epistemicOk) {
            return this._enforceRejection(proposal.proposalId, 'epistemic_conflict', epistemicMsg);
        }

        const [constitutionOk, constitutionMsg] = this.constitution.evaluate(proposal, this.systemContext);
        if (!constitutionOk) {
            return this._enforceRejection(proposal.proposalId, 'policy_violation_blocked', constitutionMsg);
        }

        const executionId = `exec:${Math.random().toString(36).slice(2, 10)}`;
        const commitEntry = {
            executionId,
            proposalId: proposal.proposalId,
            timestamp: Date.now(),
            actionType: proposal.actionType,
            payload: proposal.payload,
            provenance: {
                proposer: proposal.proposer,
                confidence,
                authorityGatewaySignature: 'verified_gateway_ack_v1',
            },
            status: 'committed',
        };
        this.truthLogV0.push(commitEntry);

        const beliefKey = `state_${proposal.payload?.target_asset ?? 'default'}`;
        this.epistemicEngine.commitBelief({ [beliefKey]: 'committed_and_active' }, `Execution Successful (ID: ${executionId})`);

        return {
            executionId,
            decision: 'approved_and_executed',
            timestamp: Date.now(),
        };
    }

    _evaluateEpistemic(proposal) {
        const [confidenceValue, ok, msg] = this.epistemicEngine.evaluateProposal(proposal);
        if (ok === false) {
            return [false, msg];
        }
        return [true, msg];
    }

    _enforceRejection(proposalId, reasonCode, message) {
        const rejectionEntry = {
            proposalId,
            timestamp: Date.now(),
            status: reasonCode,
            reason: message,
        };
        this.truthLogV0.push(rejectionEntry);
        return {
            decision: reasonCode,
            reason: message,
            timestamp: Date.now(),
        };
    }

    reconstructExecutionTrace() {
        return [...this.truthLogV0];
    }
}
