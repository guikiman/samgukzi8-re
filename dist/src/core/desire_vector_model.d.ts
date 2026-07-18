/**
 * [51] 무장 욕구 다차원 벡터 모델 — DesireVectorModel
 *
 * 목적: 무장 성향에 따른 행동 우선순위 연산.
 */
export interface DesireVector {
    ambition: number;
    loyalty: number;
    security: number;
    fame: number;
}
export declare class DesireVectorModel {
    calculatePriority(desire: DesireVector): string;
}
//# sourceMappingURL=desire_vector_model.d.ts.map