/**
 * [4] 인공지능 기반 '경어/비경어 전용 대사 마스크 맵'
 *
 * DialoguePolitenessMask:
 *   신분 거리 + 친밀도 + 성격 유형을 연계하여 대사 템플릿의
 *   $Formal / $Informal 노드를 동적으로 선택
 *
 * PolitenessLevel:
 *   FORMAL   — 신분 거리 ↑, 친밀도 ↓, 타겟 신분 높음
 *   NEUTRAL  — 동등 관계
 *   INFORMAL — 친밀도 ↑, 동등/하위 신분
 *   RUDE     — 적대 관계 or 성격(난폭) + 친밀도 ↓
 */
import type { IGameStore } from './types.js';
export type PolitenessLevel = 'FORMAL' | 'NEUTRAL' | 'INFORMAL' | 'RUDE';
export interface DialogueTemplate {
    readonly formal: string;
    readonly neutral: string;
    readonly informal: string;
    readonly rude: string;
}
export declare class DialoguePolitenessMask {
    private readonly store;
    constructor(store: IGameStore);
    /**
     * [4] 경어 레벨 결정
     *
     * 신분 거리(rankDist) + 친밀도(affinity) + 성격(personality) 기반
     *
     * FORMAL:   rankDist ≥ 3 AND affinity < 50
     * NEUTRAL:  rankDist ≤ 2 AND affinity ≥ 50
     * INFORMAL: affinity ≥ 70 OR (rankDist ≤ 1 AND affinity ≥ 40)
     * RUDE:     affinity < 20 OR personality === 'brutal'
     */
    getPolitenessLevel(speakerId: string, targetId: string): PolitenessLevel;
    /**
     * 대사 템플릿에서 경어 레벨에 맞는 노드 선택
     *
     * $Formal → FORMAL
     * $Neutral → NEUTRAL
     * $Informal → INFORMAL
     * $Rude → RUDE
     */
    selectTemplate(templates: DialogueTemplate, level: PolitenessLevel): string;
    private getAffinity;
}
//# sourceMappingURL=dialogue_politeness.d.ts.map