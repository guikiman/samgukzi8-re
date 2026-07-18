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

// ============================================================
// 패시브 버프 타입 정의
// ============================================================

export interface PassiveBuff {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly source: BuffSource;
    readonly effects: BuffEffect[];
    readonly duration: number; // -1 = permanent
    readonly remainingTurns: number;
    readonly isActive: boolean;
}

export type BuffSource =
    | 'TECHNOLOGY'
    | 'EMPEROR_ENDORSEMENT'
    | 'REPUTATION'
    | 'SPECIAL_EVENT'
    | 'FACTION_POLICY'
    | 'CAPITAL_IMPROVEMENT';

export interface BuffEffect {
    readonly stat: BuffStat;
    readonly operation: 'ADD' | 'MULTIPLY' | 'SET';
    readonly value: number;
}

export type BuffStat =
    | 'GOLD_PRODUCTION'
    | 'FOOD_PRODUCTION'
    | 'RECRUITMENT_RATE'
    | 'TRAINING_EFFICIENCY'
    | 'DIPLOMACY_POWER'
    | 'MORALE'
    | 'TECH_RESEARCH_SPEED'
    | 'REPUTATION_GAIN'
    | 'ACTION_POINT_BONUS'
    | 'INTELLIGENCE_GAIN'
    | 'CHARISMA_GAIN';

export interface FactionPassiveBuffState {
    readonly factionId: FactionID;
    readonly activeBuffs: PassiveBuff[];
    readonly aggregatedEffects: Record<BuffStat, number>;
    readonly turnApplied: number;
}

// ============================================================
// 패시브 버프 소스 정의
// ============================================================

export interface TechBuffDefinition {
    readonly minTechLevel: number;
    readonly effects: Array<{ stat: BuffStat; operation: 'ADD' | 'MULTIPLY'; value: number }>;
}

export interface EmperorEndorsementBuff {
    readonly isEndorsed: boolean;
    readonly endorsementLevel: number; // 1-5
    readonly effects: BuffEffect[];
}

export interface ReputationTier {
    readonly minReputation: number;
    readonly effects: BuffEffect[];
}

// ============================================================
// FactionPassiveBuffEvaluator
// ============================================================

const TECH_BUFF_TABLE: TechBuffDefinition[] = [
    { minTechLevel: 1, effects: [{ stat: 'FOOD_PRODUCTION', operation: 'ADD', value: 5 }] },
    { minTechLevel: 2, effects: [{ stat: 'FOOD_PRODUCTION', operation: 'ADD', value: 10 }, { stat: 'GOLD_PRODUCTION', operation: 'ADD', value: 5 }] },
    { minTechLevel: 3, effects: [{ stat: 'FOOD_PRODUCTION', operation: 'ADD', value: 15 }, { stat: 'GOLD_PRODUCTION', operation: 'ADD', value: 10 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.05 }] },
    { minTechLevel: 4, effects: [{ stat: 'FOOD_PRODUCTION', operation: 'ADD', value: 20 }, { stat: 'GOLD_PRODUCTION', operation: 'ADD', value: 15 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.1 }, { stat: 'TRAINING_EFFICIENCY', operation: 'MULTIPLY', value: 0.05 }] },
    { minTechLevel: 5, effects: [{ stat: 'FOOD_PRODUCTION', operation: 'ADD', value: 30 }, { stat: 'GOLD_PRODUCTION', operation: 'ADD', value: 25 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.15 }, { stat: 'TRAINING_EFFICIENCY', operation: 'MULTIPLY', value: 0.1 }, { stat: 'TECH_RESEARCH_SPEED', operation: 'MULTIPLY', value: 0.1 }] },
];

const REPUTATION_BUFF_TABLE: ReputationTier[] = [
    { minReputation: 0, effects: [{ stat: 'DIPLOMACY_POWER', operation: 'MULTIPLY', value: -0.2 }] },
    { minReputation: 200, effects: [] },
    { minReputation: 500, effects: [{ stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 10 }, { stat: 'REPUTATION_GAIN', operation: 'MULTIPLY', value: 0.1 }] },
    { minReputation: 800, effects: [{ stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 20 }, { stat: 'REPUTATION_GAIN', operation: 'MULTIPLY', value: 0.2 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.05 }] },
    { minReputation: 1000, effects: [{ stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 30 }, { stat: 'REPUTATION_GAIN', operation: 'MULTIPLY', value: 0.3 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.1 }, { stat: 'GOLD_PRODUCTION', operation: 'MULTIPLY', value: 0.1 }] },
];

const EMPEROR_ENDORSEMENT_EFFECTS: Record<number, BuffEffect[]> = {
    1: [{ stat: 'REPUTATION_GAIN', operation: 'ADD', value: 5 }, { stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 10 }],
    2: [{ stat: 'REPUTATION_GAIN', operation: 'ADD', value: 10 }, { stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 20 }, { stat: 'GOLD_PRODUCTION', operation: 'MULTIPLY', value: 0.05 }],
    3: [{ stat: 'REPUTATION_GAIN', operation: 'ADD', value: 15 }, { stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 30 }, { stat: 'GOLD_PRODUCTION', operation: 'MULTIPLY', value: 0.1 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.05 }],
    4: [{ stat: 'REPUTATION_GAIN', operation: 'ADD', value: 20 }, { stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 40 }, { stat: 'GOLD_PRODUCTION', operation: 'MULTIPLY', value: 0.15 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.1 }, { stat: 'MORALE', operation: 'ADD', value: 5 }],
    5: [{ stat: 'REPUTATION_GAIN', operation: 'ADD', value: 30 }, { stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 50 }, { stat: 'GOLD_PRODUCTION', operation: 'MULTIPLY', value: 0.2 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.15 }, { stat: 'MORALE', operation: 'ADD', value: 10 }, { stat: 'TECH_RESEARCH_SPEED', operation: 'MULTIPLY', value: 0.1 }],
};

const REPUTATION_TIERS: ReputationTier[] = [
    { minReputation: 0, effects: [{ stat: 'DIPLOMACY_POWER', operation: 'MULTIPLY', value: -0.3 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: -0.1 }] },
    { minReputation: 200, effects: [] },
    { minReputation: 500, effects: [{ stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 10 }, { stat: 'REPUTATION_GAIN', operation: 'MULTIPLY', value: 0.05 }] },
    { minReputation: 800, effects: [{ stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 20 }, { stat: 'REPUTATION_GAIN', operation: 'MULTIPLY', value: 0.1 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.05 }] },
    { minReputation: 1000, effects: [{ stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 30 }, { stat: 'REPUTATION_GAIN', operation: 'MULTIPLY', value: 0.15 }, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.1 }, { stat: 'GOLD_PRODUCTION', operation: 'MULTIPLY', value: 0.1 }] },
];

export class FactionPassiveBuffEvaluator {
    private readonly buffRegistry: Map<FactionID, FactionPassiveBuffState> = new Map();
    private turnCounter = 0;

    /**
     * 매 턴 시작 시 모든 세력의 패시브 버프를 평가하고 적용한다.
     * @param factions 평가할 세력 목록
     * @param turn 현재 턴 정보
     * @returns 각 세력별 집계된 버프 효과 맵
     */
    evaluateAllFactions(
        factions: Faction[],
        turn: GameTurn,
    ): Map<FactionID, Record<BuffStat, number>> {
        const results = new Map<FactionID, Record<BuffStat, number>>();
        this.turnCounter = turn.turnIndex;

        for (const faction of factions) {
            const effects = this.evaluateSingleFaction(faction, turn);
            results.set(faction.id, effects);
        }

        return results;
    }

    /**
     * 단일 세력의 모든 패시브 버프를 평가한다.
     */
    evaluateSingleFaction(
        faction: Faction,
        _turn: GameTurn,
    ): Record<BuffStat, number> {
        const aggregated: Record<BuffStat, number> = {
            GOLD_PRODUCTION: 0,
            FOOD_PRODUCTION: 0,
            RECRUITMENT_RATE: 0,
            TRAINING_EFFICIENCY: 0,
            DIPLOMACY_POWER: 0,
            MORALE: 0,
            TECH_RESEARCH_SPEED: 0,
            REPUTATION_GAIN: 0,
            ACTION_POINT_BONUS: 0,
            INTELLIGENCE_GAIN: 0,
            CHARISMA_GAIN: 0,
        };

        // 1. 기술 레벨 기반 버프
        this.applyTechBuffs(faction, aggregated);

        // 2. 평판 기반 버프
        this.applyReputationBuffs(faction, aggregated);

        // 3. 황제 옹립 버프 (추후 확장: emperorEndorsement 필드)
        // 현재 Faction 타입에 emperorEndorsement 필드가 없으므로
        // reputation이 900 이상이고 techLevel이 3 이상이면 황제 옹립 효과 모사
        if (faction.reputation >= 900 && faction.techLevel >= 3) {
            this.applyEmperorEndorsementBuffs(3, aggregated);
        }

        // 4. 정책 기반 버프
        this.applyPolicyBuffs(faction, aggregated);

        // 5. 버프 상태 저장
        this.recordBuffState(faction.id, aggregated, _turn);

        return aggregated;
    }

    /**
     * 기술 레벨에 따른 패시브 버프 적용
     */
    private applyTechBuffs(faction: Faction, aggregated: Record<BuffStat, number>): void {
        const techLevel = faction.techLevel;
        let bestMatch: TechBuffDefinition | null = null;

        for (const tier of TECH_BUFF_TABLE) {
            if (techLevel >= tier.minTechLevel) {
                bestMatch = tier;
            }
        }

        if (bestMatch) {
            for (const effect of bestMatch.effects) {
                this.applyEffect(aggregated, effect);
            }
        }
    }

    /**
     * 평판 기반 버프 적용
     */
    private applyReputationBuffs(faction: Faction, aggregated: Record<BuffStat, number>): void {
        let bestMatch: ReputationTier | null = null;

        for (const tier of REPUTATION_TIERS) {
            if (faction.reputation >= tier.minReputation) {
                bestMatch = tier;
            }
        }

        if (bestMatch) {
            for (const effect of bestMatch.effects) {
                this.applyEffect(aggregated, effect);
            }
        }
    }

    /**
     * 황제 옹립 버프 적용
     */
    private applyEmperorEndorsementBuffs(
        level: number,
        aggregated: Record<BuffStat, number>,
    ): void {
        const effects = EMPEROR_ENDORSEMENT_EFFECTS[level];
        if (effects) {
            for (const effect of effects) {
                this.applyEffect(aggregated, effect);
            }
        }
    }

    /**
     * 세력 정책 기반 버프 적용
     */
    private applyPolicyBuffs(faction: Faction, aggregated: Record<BuffStat, number>): void {
        const policy = faction.policy;

        // 경제 집중 정책 → 금/식량 생산 보너스
        if (policy.economyFocus > 70) {
            this.applyEffect(aggregated, { stat: 'GOLD_PRODUCTION', operation: 'MULTIPLY', value: 0.1 });
            this.applyEffect(aggregated, { stat: 'FOOD_PRODUCTION', operation: 'MULTIPLY', value: 0.1 });
        }

        // 군사 집중 정책 → 징병/훈련 보너스
        if (policy.militaryFocus > 70) {
            this.applyEffect(aggregated, { stat: 'RECRUITMENT_RATE', operation: 'MULTIPLY', value: 0.1 });
            this.applyEffect(aggregated, { stat: 'TRAINING_EFFICIENCY', operation: 'MULTIPLY', value: 0.1 });
        }

        // 외교 집중 정책 → 외교력 보너스
        if (policy.diplomacyFocus > 70) {
            this.applyEffect(aggregated, { stat: 'DIPLOMACY_POWER', operation: 'ADD', value: 15 });
        }

        // 문화 집중 정책 → 기술 연구 속도 보너스
        if (policy.cultureFocus > 70) {
            this.applyEffect(aggregated, { stat: 'TECH_RESEARCH_SPEED', operation: 'MULTIPLY', value: 0.1 });
        }
    }

    /**
     * 개별 버프 효과를 집계 결과에 적용한다.
     * ADD: 단순 가산
     * MULTIPLY: 백분율 가산 (0.1 = +10%)
     * SET: 절대값 설정
     */
    private applyEffect(
        aggregated: Record<BuffStat, number>,
        effect: BuffEffect,
    ): void {
        switch (effect.operation) {
            case 'ADD':
                aggregated[effect.stat] += effect.value;
                break;
            case 'MULTIPLY':
                aggregated[effect.stat] += effect.value;
                break;
            case 'SET':
                aggregated[effect.stat] = effect.value;
                break;
        }
    }

    /**
     * 버프 상태를 레지스트리에 기록한다.
     */
    private recordBuffState(
        factionId: FactionID,
        effects: Record<BuffStat, number>,
        turn: GameTurn,
    ): void {
        const existing = this.buffRegistry.get(factionId);
        const activeBuffs: PassiveBuff[] = [];

        // 활성 버프 목록 생성
        for (const [stat, value] of Object.entries(effects)) {
            if (value !== 0) {
                activeBuffs.push({
                    id: `buff_${factionId}_${stat}`,
                    name: `${stat} Boost`,
                    description: `${stat} ${value > 0 ? '+' : ''}${value}`,
                    source: 'TECHNOLOGY',
                    effects: [{ stat: stat as BuffStat, operation: value > 0 ? 'ADD' : 'MULTIPLY', value: Math.abs(value) }],
                    duration: -1,
                    remainingTurns: -1,
                    isActive: true,
                });
            }
        }

        this.buffRegistry.set(factionId, {
            factionId,
            activeBuffs,
            aggregatedEffects: { ...effects },
            turnApplied: this.turnCounter,
        });
    }

    /**
     * 특정 세력의 현재 집계 버프 효과를 반환한다.
     */
    getAggregatedEffects(factionId: FactionID): Record<BuffStat, number> | null {
        const state = this.buffRegistry.get(factionId);
        return state ? { ...state.aggregatedEffects } : null;
    }

    /**
     * 특정 세력의 활성 버프 목록을 반환한다.
     */
    getActiveBuffs(factionId: FactionID): PassiveBuff[] {
        const state = this.buffRegistry.get(factionId);
        return state ? [...state.activeBuffs] : [];
    }

    /**
     * 모든 세력의 버프 상태를 반환한다.
     */
    getAllBuffStates(): FactionPassiveBuffState[] {
        return Array.from(this.buffRegistry.values());
    }

    /**
     * 버프 레지스트리를 초기화한다.
     */
    clear(): void {
        this.buffRegistry.clear();
        this.turnCounter = 0;
    }
}
