/**
 * [B21] 사기치 동적 변동 및 상태 연동기 — TacticalMoraleEngine
 *
 * 목적: 전장에서 실시간 발생하는 대장 궤멸, 일기토 패배 등 충격
 *       이벤트에 따른 아군 전체의 사기 변동성 연산.
 *
 * 핵심 로직:
 *   1. 대장 부대 궤멸 시 전 아군 사기 즉시 -30
 *   2. 사기 30 이하 시 공/방 20% 감쇄 + 탈영 패널티
 */
const MORALE_EVENT_DELTA = {
    COMMANDER_DEFEATED: -30,
    DUEL_LOST: -15,
    DUEL_WON: 15,
    ALLY_DESTROYED: -10,
    ENEMY_DESTROYED: 10,
    SUPPLY_CUT: -20,
    SIEGE_WALL_BREACHED: -25,
    RALLY: 20,
};
const PANIC_THRESHOLD = 30;
const PANIC_ATTACK_PENALTY = 0.20; // 20% 감쇄
const PANIC_DEFENSE_PENALTY = 0.20;
export class TacticalMoraleEngine {
    constructor() {
        this.moraleMap = new Map();
    }
    /** 세력별 사기 초기화 */
    initialize(factionId, initialMorale = 80) {
        const state = {
            factionId,
            globalMorale: Math.max(0, Math.min(100, initialMorale)),
            isPanic: initialMorale <= PANIC_THRESHOLD,
            attackPenalty: 0,
            defensePenalty: 0,
            desertionChance: 0,
        };
        this.moraleMap.set(factionId, state);
        return this.applyPanicEffects(state);
    }
    /** 사기 이벤트 적용 */
    applyEvent(factionId, event) {
        const current = this.moraleMap.get(factionId);
        if (!current)
            return this.initialize(factionId);
        const delta = MORALE_EVENT_DELTA[event];
        const newMorale = Math.max(0, Math.min(100, current.globalMorale + delta));
        const newState = {
            ...current,
            globalMorale: newMorale,
        };
        this.moraleMap.set(factionId, newState);
        return this.applyPanicEffects(newState);
    }
    /** 패닉 효과 적용 */
    applyPanicEffects(state) {
        const isPanic = state.globalMorale <= PANIC_THRESHOLD;
        return {
            ...state,
            isPanic,
            attackPenalty: isPanic ? PANIC_ATTACK_PENALTY : 0,
            defensePenalty: isPanic ? PANIC_DEFENSE_PENALTY : 0,
            desertionChance: isPanic ? (PANIC_THRESHOLD - state.globalMorale) / 100 : 0,
        };
    }
    /** 매 턴 사기 자연 회복 */
    passiveRegen(factionId) {
        const current = this.moraleMap.get(factionId);
        if (!current)
            return this.initialize(factionId);
        // 턴당 3 자연 회복 (최대 80, 패닉 시 5)
        const regen = current.isPanic ? 5 : 3;
        const newMorale = Math.min(80, current.globalMorale + regen);
        const newState = { ...current, globalMorale: newMorale };
        this.moraleMap.set(factionId, newState);
        return this.applyPanicEffects(newState);
    }
    /** 현재 사기 상태 조회 */
    getState(factionId) {
        return this.moraleMap.get(factionId);
    }
}
//# sourceMappingURL=tactical_morale_engine.js.map