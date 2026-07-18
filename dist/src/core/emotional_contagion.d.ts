/**
 * [Task 26] 전염성 감정 전파 — EmotionalContagion
 *
 * 관계망을 통해 무장 간 감정(스트레스/분노/환희)이 전파되는 시스템.
 * 인접한 무장의 심리 상태가 주변으로 확산되는 효과를 모델링.
 */
import type { OfficerID, RelationshipEdge } from "./types.js";
export type EmotionType = "STRESS" | "ANGER" | "JOY" | "SADNESS" | "FEAR" | "CALM";
export interface EmotionState {
    readonly officerId: OfficerID;
    stress: number;
    anger: number;
    joy: number;
    sadness: number;
    fear: number;
    calm: number;
}
export interface ContagionConfig {
    readonly spreadRate: number;
    readonly decayPerTurn: number;
    readonly affinityBoost: number;
    readonly maxDistance: number;
    readonly personalityResistance: number;
}
export declare class EmotionalContagion {
    private config;
    private emotions;
    constructor(config?: Partial<ContagionConfig>);
    initialize(officerId: OfficerID, initial?: Partial<EmotionState>): EmotionState;
    getEmotion(officerId: OfficerID): EmotionState | undefined;
    setEmotion(officerId: OfficerID, updates: Partial<EmotionState>): void;
    /**
     * 감정 전파 실행: 관계 그래프를 따라 감정이 퍼짐
     */
    propagate(relationships: RelationshipEdge[], officerIds: OfficerID[], personalityMap: Map<OfficerID, string>): Map<OfficerID, EmotionState>;
    /**
     * 모든 무장의 감정을 턴마다 자연 감소
     */
    decayAll(): void;
    /**
     * 특정 사건으로 감정 변화
     */
    applyEvent(officerId: OfficerID, emotionDelta: Partial<EmotionState>): void;
    getDominantEmotion(officerId: OfficerID): {
        emotion: EmotionType;
        intensity: number;
    };
    private buildAdjacency;
    private getNeighborsWithinDistance;
    setConfig(config: Partial<ContagionConfig>): void;
}
//# sourceMappingURL=emotional_contagion.d.ts.map