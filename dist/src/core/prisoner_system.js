/**
 * [B19] 포로 포획/처분 시스템 — Prisoner System
 *
 * PrisonerManager:
 *   - capturePrisoner(): 전투 후 포로 포획
 *   - executePrisoner(): 처단 (외교 -50)
 *   - recruitPrisoner(): 등용 (충성도 역수 × 설득력)
 *   - releasePrisoner(): 해방 (외교 +20)
 *   - negotiateRansom(): 포로 협상
 *   - attemptEscape(): 탈옥 (지력/200 확률)
 */
export class PrisonerManager {
    constructor() {
        this.prisoners = new Map();
    }
    /** 포로 포획 */
    capturePrisoner(officerId, captorFactionId, originalFactionId, remainingHp, maxHp) {
        // 포로 포획 확률 = (1 - HP/최대HP) × 0.7
        const hpRatio = remainingHp / Math.max(1, maxHp);
        const captureChance = (1 - hpRatio) * 0.7;
        if (Math.random() < captureChance) {
            const prisoner = {
                officerId,
                captorFactionId,
                originalFactionId,
                captureDate: Date.now(),
                status: 'CAPTURED',
                escapeAttempts: 0,
                negotiationCount: 0,
            };
            this.prisoners.set(officerId, prisoner);
            return prisoner;
        }
        return null;
    }
    /** 처단 */
    executePrisoner(officerId) {
        const prisoner = this.prisoners.get(officerId);
        if (!prisoner || prisoner.status === 'EXECUTED' || prisoner.status === 'RELEASED')
            return null;
        this.prisoners.set(officerId, { ...prisoner, status: 'EXECUTED' });
        return {
            officerId,
            action: 'EXECUTED',
            success: true,
            message: `${officerId}를 처단했습니다.`,
            diplomacyModifier: -50,
        };
    }
    /** 등용 */
    recruitPrisoner(officerId, _recruiterId, loyalty, persuasion) {
        const prisoner = this.prisoners.get(officerId);
        if (!prisoner || prisoner.status !== 'CAPTURED') {
            return { officerId, action: 'RECRUITED', success: false, message: '등용할 수 없는 상태입니다.', diplomacyModifier: 0 };
        }
        // 성공 확률 = (100 - 충성도) / 100 × 설득력 / 100
        const successChance = ((100 - loyalty) / 100) * (persuasion / 100);
        const success = Math.random() < successChance;
        if (success) {
            this.prisoners.set(officerId, { ...prisoner, status: 'RECRUITED' });
            return { officerId, action: 'RECRUITED', success: true, message: `${officerId} 등용 성공!`, diplomacyModifier: 10 };
        }
        this.prisoners.set(officerId, { ...prisoner, negotiationCount: prisoner.negotiationCount + 1 });
        return { officerId, action: 'RECRUITED', success: false, message: `${officerId} 등용 실패.`, diplomacyModifier: -5 };
    }
    /** 해방 */
    releasePrisoner(officerId) {
        const prisoner = this.prisoners.get(officerId);
        if (!prisoner || prisoner.status !== 'CAPTURED')
            return null;
        this.prisoners.set(officerId, { ...prisoner, status: 'RELEASED' });
        return {
            officerId, action: 'RELEASED', success: true,
            message: `${officerId}를 석방했습니다.`, diplomacyModifier: 20,
        };
    }
    /** 포로 협상 (금 요구) */
    negotiateRansom(officerId, ransomAmount) {
        const prisoner = this.prisoners.get(officerId);
        if (!prisoner || prisoner.status !== 'CAPTURED') {
            return { officerId, action: 'RELEASED', success: false, message: '협상 불가.', diplomacyModifier: 0 };
        }
        // 무조건 금액만 지불하면 석방
        if (ransomAmount >= 100) {
            this.prisoners.set(officerId, { ...prisoner, status: 'RELEASED' });
            return { officerId, action: 'RELEASED', success: true, message: `${officerId} 석방 (금 ${ransomAmount}).`, diplomacyModifier: 5 };
        }
        return { officerId, action: 'RELEASED', success: false, message: '협상 금액 부족.', diplomacyModifier: 0 };
    }
    /** 탈옥 시도 */
    attemptEscape(officerId, intelligence) {
        const prisoner = this.prisoners.get(officerId);
        if (!prisoner || prisoner.status !== 'CAPTURED') {
            return { officerId, action: 'ESCAPED', success: false, message: '탈옥 불가.', diplomacyModifier: 0 };
        }
        // 탈옥 확률 = 지력 / 200
        const escapeChance = intelligence / 200;
        if (Math.random() < escapeChance) {
            this.prisoners.set(officerId, { ...prisoner, status: 'ESCAPED', escapeAttempts: prisoner.escapeAttempts + 1 });
            return { officerId, action: 'ESCAPED', success: true, message: `${officerId} 탈옥 성공!`, diplomacyModifier: -10 };
        }
        this.prisoners.set(officerId, { ...prisoner, escapeAttempts: prisoner.escapeAttempts + 1 });
        return { officerId, action: 'ESCAPED', success: false, message: `${officerId} 탈옥 실패.`, diplomacyModifier: 0 };
    }
    getPrisoner(officerId) {
        return this.prisoners.get(officerId);
    }
    getPrisonersByFaction(factionId) {
        return Array.from(this.prisoners.values()).filter(p => p.captorFactionId === factionId && p.status === 'CAPTURED');
    }
    getAllPrisoners() {
        return Array.from(this.prisoners.values());
    }
    clear() {
        this.prisoners.clear();
    }
}
//# sourceMappingURL=prisoner_system.js.map