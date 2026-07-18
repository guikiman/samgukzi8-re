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
export class WeakMapRelationTracker {
    constructor() {
        this.relations = new WeakMap();
    }
    /** 관계 추가 */
    addRelation(subject, target, relation) {
        if (!this.relations.has(subject)) {
            this.relations.set(subject, new Map());
        }
        const subjectRelations = this.relations.get(subject);
        if (!subjectRelations.has(target)) {
            subjectRelations.set(target, []);
        }
        subjectRelations.get(target).push(relation);
    }
    /** 관계 조회 */
    getRelations(subject, target) {
        return this.relations.get(subject)?.get(target) ?? [];
    }
    /** 특정 대상과의 모든 관계 조회 */
    getAllRelations(subject) {
        return this.relations.get(subject) ?? new Map();
    }
    /** 관계 제거 */
    removeRelations(subject, target) {
        this.relations.get(subject)?.delete(target);
    }
    /** 특정 대상과의 모든 관계 제거 (대상이 사라질 때) */
    removeAllRelationsWith(target) {
        // WeakMap은 iterable하지 않으므로 이 메서드는 제한적
        // 실제로는 GC가 자동 처리
    }
    /** 관계 수 조회 */
    getRelationCount(subject) {
        return this.relations.get(subject)?.size ?? 0;
    }
    /** 전체 관계 수 (근사값) */
    getTotalRelationCount() {
        // WeakMap은 iterable하지 않아 정확한 카운트 불가
        return -1;
    }
}
//# sourceMappingURL=weak_map_relation_tracker.js.map