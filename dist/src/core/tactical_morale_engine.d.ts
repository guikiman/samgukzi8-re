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
export type MoraleEvent = 'COMMANDER_DEFEATED' | 'DUEL_LOST' | 'DUEL_WON' | 'ALLY_DESTROYED' | 'ENEMY_DESTROYED' | 'SUPPLY_CUT' | 'SIEGE_WALL_BREACHED' | 'RALLY';
export interface MoraleState {
    readonly factionId: string;
    readonly globalMorale: number;
    readonly isPanic: boolean;
    readonly attackPenalty: number;
    readonly defensePenalty: number;
    readonly desertionChance: number;
}
export declare class TacticalMoraleEngine {
    private moraleMap;
    /** 세력별 사기 초기화 */
    initialize(factionId: string, initialMorale?: number): MoraleState;
    /** 사기 이벤트 적용 */
    applyEvent(factionId: string, event: MoraleEvent): MoraleState;
    /** 패닉 효과 적용 */
    private applyPanicEffects;
    /** 매 턴 사기 자연 회복 */
    passiveRegen(factionId: string): MoraleState;
    /** 현재 사기 상태 조회 */
    getState(factionId: string): MoraleState | undefined;
}
//# sourceMappingURL=tactical_morale_engine.d.ts.map