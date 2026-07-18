/**
 * [17] 방랑군 전용 절차적 퀘스트 제너레이터 (Procedural Rogue Quests)
 *
 * ProceduralQuestGenerator:
 *   - 도시 상업/치안/군주 성향 결합 → 동적 청부 임무 생성
 *   - 템플릿 + GoldFactor 동적 보상 정형화
 *   - 매달 의뢰판 목록 무작위 조합
 */

import type { City, IGameStore } from './types.js';

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

export class ProceduralQuestGenerator {
    private templates: QuestTemplate[];

    constructor() {
        this.templates = this.buildTemplates();
    }

    /**
     * [17] 템플릿 퀘스트 정의
     */
    private buildTemplates(): QuestTemplate[] {
        return [
            { id: 'quest_1', title: '도둑 소탕', description: '도시 주변 도적단을 소탕하라', difficulty: 'EASY', baseReward: 100, baseReputation: 5, requiredStats: { might: 50 } },
            { id: 'quest_2', title: '군량 호송', description: '인근 도시로 군량을 안전하게 호송하라', difficulty: 'MEDIUM', baseReward: 200, baseReputation: 10, requiredStats: { leadership: 60 } },
            { id: 'quest_3', title: '밀정 색출', description: '적국 첩자를 찾아내 제거하라', difficulty: 'MEDIUM', baseReward: 300, baseReputation: 15, requiredStats: { intelligence: 65 } },
            { id: 'quest_4', title: '반란 진압', description: '도시 내 반란 세력을 진압하라', difficulty: 'HARD', baseReward: 500, baseReputation: 25, requiredStats: { might: 75, leadership: 70 } },
            { id: 'quest_5', title: '보급로 차단', description: '적군의 보급로를 차단하고 약탈하라', difficulty: 'HARD', baseReward: 600, baseReputation: 20, requiredStats: { intelligence: 70, might: 65 } },
            { id: 'quest_6', title: '장수 암살', description: '적군의 핵심 장수를 암습하라', difficulty: 'LEGENDARY', baseReward: 1000, baseReputation: 40, requiredStats: { might: 85, intelligence: 75 } },
            { id: 'quest_7', title: '외교 문서 탈취', description: '적군의 외교 문서를 빼내오라', difficulty: 'HARD', baseReward: 400, baseReputation: 20, requiredStats: { intelligence: 80 } },
        ];
    }

    /**
     * [17] 매달 퀘스트 목록 생성
     *
     * GoldFactor = 도시 상업지수 / 100
     * 보상 = baseReward × (1 + GoldFactor × 0.5)
     */
    generateQuests(city: City, count: number = 3): GeneratedQuest[] {
        const shuffled = [...this.templates].sort(() => Math.random() - 0.5);
        const goldFactor = city.goldIncome / 100;

        return shuffled.slice(0, count).map(template => ({
            template,
            reward: Math.round(template.baseReward * (1 + goldFactor * 0.5)),
            reputation: template.baseReputation,
            cityName: city.name,
            factionName: '',
            isUrgent: Math.random() < 0.2, // 20% 긴급 의뢰
        }));
    }
}
