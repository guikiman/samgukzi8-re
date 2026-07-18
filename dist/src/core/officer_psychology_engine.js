/**
 * [8] 무장 심리 엔진 — Officer Psychology Engine
 *
 * [381] 번아웃 (우울증)
 * [382] 편집증(의심병)
 * [389] 트라우마 관리
 *
 * AI 무장의 번아웃, 편집증, 충성도 변동 및 사직서 제출 확률을
 * 매달 계산하여 상태를 변이시키는 자아 FSM 엔진
 */
export class OfficerPsychologyEngine {
    constructor() {
        this.burnout = new Map();
        this.paranoia = new Map();
        this.trauma = new Map();
        this.resignationHistory = [];
        this.defectHistory = [];
    }
    /**
     * 번아웃 증가
     */
    addBurnout(officerId, amount) {
        const current = this.burnout.get(officerId) ?? 0;
        this.burnout.set(officerId, Math.min(100, current + amount));
    }
    getBurnout(officerId) {
        return this.burnout.get(officerId) ?? 0;
    }
    /**
     * 편집증 발동
     */
    triggerParanoia(officerId, amount = 20) {
        const current = this.paranoia.get(officerId) ?? 0;
        this.paranoia.set(officerId, Math.min(100, current + amount));
    }
    getParanoia(officerId) {
        return this.paranoia.get(officerId) ?? 0;
    }
    /**
     * 트라우마 부여
     */
    addTrauma(officerId) {
        this.trauma.set(officerId, true);
    }
    hasTrauma(officerId) {
        return this.trauma.get(officerId) ?? false;
    }
    /**
     * 매월 심리 상태 업데이트
     *
     * - 번아웃 ≥ 80 → 사직서 제출 확률 30%
     * - 편집증 ≥ 70 → 배신 확률 25%
     * - 트라우마 보유 시 모든 확률 1.5배
     */
    processMonthlyUpdate(officerId, baseLoyalty, workload) {
        const currentBurnout = this.burnout.get(officerId) ?? 0;
        const currentParanoia = this.paranoia.get(officerId) ?? 0;
        const hasTrauma = this.trauma.get(officerId) ?? false;
        // 업무량 → 번아웃 증가
        if (workload > 60) {
            this.addBurnout(officerId, Math.floor((workload - 60) * 0.5));
        }
        // 번아웃 자연 회복 (10% 확률로 5 감소)
        if (currentBurnout > 0 && Math.random() < 0.1) {
            this.burnout.set(officerId, Math.max(0, currentBurnout - 5));
        }
        // 편집증 자연 감소
        if (currentParanoia > 0 && Math.random() < 0.05) {
            this.paranoia.set(officerId, Math.max(0, currentParanoia - 3));
        }
        const burnoutLevel = this.burnout.get(officerId) ?? 0;
        const paranoiaLevel = this.paranoia.get(officerId) ?? 0;
        // 충성도 변동
        let loyaltyDelta = 0;
        if (burnoutLevel > 50)
            loyaltyDelta -= Math.floor(burnoutLevel * 0.1);
        if (paranoiaLevel > 40)
            loyaltyDelta -= Math.floor(paranoiaLevel * 0.05);
        // 사직 검사
        let willResign = false;
        if (burnoutLevel >= OfficerPsychologyEngine.BURNOUT_THRESHOLD) {
            const resignChance = hasTrauma ? 0.45 : 0.3;
            willResign = Math.random() < resignChance;
            if (willResign)
                this.resignationHistory.push(officerId);
        }
        // 배신 검사
        let willDefect = false;
        if (paranoiaLevel >= OfficerPsychologyEngine.PARANOIA_THRESHOLD) {
            const defectChance = hasTrauma ? 0.375 : 0.25;
            willDefect = Math.random() < defectChance;
            if (willDefect)
                this.defectHistory.push(officerId);
        }
        return {
            officerId,
            burnout: burnoutLevel,
            paranoia: paranoiaLevel,
            hasTrauma,
            loyaltyDelta,
            willResign,
            willDefect,
        };
    }
    /**
     * 심리 상태 초기화
     */
    resetOfficer(officerId) {
        this.burnout.delete(officerId);
        this.paranoia.delete(officerId);
        this.trauma.delete(officerId);
    }
    getResignationHistory() {
        return this.resignationHistory.slice();
    }
    getDefectHistory() {
        return this.defectHistory.slice();
    }
    reset() {
        this.burnout.clear();
        this.paranoia.clear();
        this.trauma.clear();
        this.resignationHistory = [];
        this.defectHistory = [];
    }
}
OfficerPsychologyEngine.BURNOUT_THRESHOLD = 80;
OfficerPsychologyEngine.PARANOIA_THRESHOLD = 70;
//# sourceMappingURL=officer_psychology_engine.js.map