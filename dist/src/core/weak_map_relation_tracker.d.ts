/**
 * [E52] WeakMap 기반 관계 추적기 — WeakMapRelationTracker
 *
 * 목적: WeakMap을 사용하여 무장 객체 참조가 사라질 때
 *       자동으로 관계 데이터도 GC되도록 설계.
 *
 * 핵심 로직:
 *   1. WeakMap<Officer, Set<Officer>> 관계 저장
 *   2. 객체 소멸 시 자동 GC
 */
export interface RelationData {
    readonly type: 'FRIEND' | 'RIVAL' | 'SWORN' | 'HATE';
    readonly affinity: number;
    readonly since: number;
}
export declare class WeakMapRelationTracker {
    private relations;
    /** 관계 추가 */
    addRelation(subject: object, target: object, relation: RelationData): void;
    /** 관계 조회 */
    getRelations(subject: object, target: object): RelationData[];
    /** 특정 대상과의 모든 관계 조회 */
    getAllRelations(subject: object): Map<object, RelationData[]>;
    /** 관계 제거 */
    removeRelations(subject: object, target: object): void;
    /** 특정 대상과의 모든 관계 제거 (대상이 사라질 때) */
    removeAllRelationsWith(target: object): void;
    /** 관계 수 조회 */
    getRelationCount(subject: object): number;
    /** 전체 관계 수 (근사값) */
    getTotalRelationCount(): number;
}
//# sourceMappingURL=weak_map_relation_tracker.d.ts.map