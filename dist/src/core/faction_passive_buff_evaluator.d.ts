/**
 * [11] 세력 단위 턴 시작 패시브 버프 평가기 — FactionPassiveBuffEvaluator
 *
 * FactionPassiveBuffEvaluator:
 *   1. 세력이 소유한 특수 기술(techLevel)에 따른 패시브 버프 평가
 *   2. 황제 옹립 여부에 따른 세력 전체 이펙트
 *   3. 세력 평판(reputation)에 따른 외교/내정 보정
 *   4. 매 턴 시작 시 세력 전체에 이로운 효과를 부여하는 이펙트 러너
 */
import type { Faction, FactionID } from './types.js';
import type { GameTurn } from './game_turn.js';
export interface PassiveBuff {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly source: BuffSource;
    readonly effects: BuffEffect[];
    readonly duration: number;
    readonly remainingTurns: number;
    readonly isActive: boolean;
}
export type BuffSource = 'TECHNOLOGY' | 'EMPEROR_ENDORSEMENT' | 'REPUTATION' | 'SPECIAL_EVENT' | 'FACTION_POLICY' | 'CAPITAL_IMPROVEMENT';
export interface BuffEffect {
    readonly stat: BuffStat;
    readonly operation: 'ADD' | 'MULTIPLY' | 'SET';
    readonly value: number;
}
export type BuffStat = 'GOLD_PRODUCTION' | 'FOOD_PRODUCTION' | 'RECRUITMENT_RATE' | 'TRAINING_EFFICIENCY' | 'DIPLOMACY_POWER' | 'MORALE' | 'TECH_RESEARCH_SPEED' | 'REPUTATION_GAIN' | 'ACTION_POINT_BONUS' | 'INTELLIGENCE_GAIN' | 'CHARISMA_GAIN';
export interface FactionPassiveBuffState {
    readonly factionId: FactionID;
    readonly activeBuffs: PassiveBuff[];
    readonly aggregatedEffects: Record<BuffStat, number>;
    readonly turnApplied: number;
}
export interface TechBuffDefinition {
    readonly minTechLevel: number;
    readonly effects: Array<{
        stat: BuffStat;
        operation: 'ADD' | 'MULTIPLY';
        value: number;
    }>;
}
export interface EmperorEndorsementBuff {
    readonly isEndorsed: boolean;
    readonly endorsementLevel: number;
    readonly effects: BuffEffect[];
}
export interface ReputationTier {
    readonly minReputation: number;
    readonly effects: BuffEffect[];
}
export declare class FactionPassiveBuffEvaluator {
    private readonly buffRegistry;
    private turnCounter;
    /**
     * 매 턴 시작 시 모든 세력의 패시브 버프를 평가하고 적용한다.
     * @param factions 평가할 세력 목록
     * @param turn 현재 턴 정보
     * @returns 각 세력별 집계된 버프 효과 맵
     */
    evaluateAllFactions(factions: Faction[], turn: GameTurn): Map<FactionID, Record<BuffStat, number>>;
    /**
     * 단일 세력의 모든 패시브 버프를 평가한다.
     */
    evaluateSingleFaction(faction: Faction, _turn: GameTurn): Record<BuffStat, number>;
    /**
     * 기술 레벨에 따른 패시브 버프 적용
     */
    private applyTechBuffs;
    /**
     * 평판 기반 버프 적용
     */
    private applyReputationBuffs;
    /**
     * 황제 옹립 버프 적용
     */
    private applyEmperorEndorsementBuffs;
    /**
     * 세력 정책 기반 버프 적용
     */
    private applyPolicyBuffs;
    /**
     * 개별 버프 효과를 집계 결과에 적용한다.
     * ADD: 단순 가산
     * MULTIPLY: 백분율 가산 (0.1 = +10%)
     * SET: 절대값 설정
     */
    private applyEffect;
    /**
     * 버프 상태를 레지스트리에 기록한다.
     */
    private recordBuffState;
    /**
     * 특정 세력의 현재 집계 버프 효과를 반환한다.
     */
    getAggregatedEffects(factionId: FactionID): Record<BuffStat, number> | null;
    /**
     * 특정 세력의 활성 버프 목록을 반환한다.
     */
    getActiveBuffs(factionId: FactionID): PassiveBuff[];
    /**
     * 모든 세력의 버프 상태를 반환한다.
     */
    getAllBuffStates(): FactionPassiveBuffState[];
    /**
     * 버프 레지스트리를 초기화한다.
     */
    clear(): void;
}
//# sourceMappingURL=faction_passive_buff_evaluator.d.ts.map