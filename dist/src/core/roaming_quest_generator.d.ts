/**
 * [17] 방랑군 전용 절차적 퀘스트 제너레이터 (Procedural Rogue Quests)
 *
 * ProceduralQuestGenerator:
 *   - 도시 상업/치안/군주 성향 결합 → 동적 청부 임무 생성
 *   - 템플릿 + GoldFactor 동적 보상 정형화
 *   - 매달 의뢰판 목록 무작위 조합
 */
import type { City } from './types.js';
export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
export interface QuestTemplate {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly difficulty: QuestDifficulty;
    readonly baseReward: number;
    readonly baseReputation: number;
    readonly requiredStats: Partial<Record<string, number>>;
}
export interface GeneratedQuest {
    readonly template: QuestTemplate;
    readonly reward: number;
    readonly reputation: number;
    readonly cityName: string;
    readonly factionName: string;
    readonly isUrgent: boolean;
}
export declare class ProceduralQuestGenerator {
    private templates;
    constructor();
    /**
     * [17] 템플릿 퀘스트 정의
     */
    private buildTemplates;
    /**
     * [17] 매달 퀘스트 목록 생성
     *
     * GoldFactor = 도시 상업지수 / 100
     * 보상 = baseReward × (1 + GoldFactor × 0.5)
     */
    generateQuests(city: City, count?: number): GeneratedQuest[];
}
//# sourceMappingURL=roaming_quest_generator.d.ts.map