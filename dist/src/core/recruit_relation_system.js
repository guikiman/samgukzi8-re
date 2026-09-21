/**
 * 등용-관계망 연동 시스템 [C-인간관계] [24]
 *
 * 등용 실패가 무장 간 관계(우호도)에 영향을 주고, 그 관계가 다시
 * 등용 성공률에 반영되는 순환을 담당한다:
 *  - 실패 시 초빙자↔대상 우호도 −10 (history에 기록)
 *  - 성공률 미리보기/실제 등용 시 우호도 보정 적용 (±0.15 클램프)
 *
 * 관계 엣지가 없으면 최초 실패 시 FRIEND 타입 엣지를 생성한다(0에서 시작).
 * 스토어의 양방향 인덱스(byOfficer.relationships)를 모두 갱신한다.
 */
/** 등용 실패 1회당 우호도 감소량 */
export const RECRUIT_FAILURE_AFFINITY_DROP = -10;
/** 관계 이력 이벤트명 */
export const RECRUIT_FAILED_EVENT = 'RECRUIT_FAILED';
/** 우호도 → 성공률 보정 환산 계수 (affinity / 200) */
const AFFINITY_TO_CHANCE_FACTOR = 200;
/** 성공률 보정 클램프 (±0.15 = ±15%p) */
const MODIFIER_CLAMP = 0.15;
/** 양방향 관계 엣지 탐색 (초빙자→대상 또는 대상→초빙자) */
function findEdgeBetween(store, a, b) {
    return store.getRelationships(a).find(e => e.target === b)
        ?? store.getRelationships(b).find(e => e.target === a);
}
/**
 * 등용 실패 후처리 — 초빙자와 대상 무장 간 우호도를 감소시킨다.
 * 엣지가 없으면 새로 생성한다 (양방향 인덱스 동시 갱신).
 */
export function applyRecruitFailure(store, recruiterId, targetId) {
    if (recruiterId === targetId)
        return;
    if (!store.getOfficer(recruiterId) || !store.getOfficer(targetId))
        return;
    const { year, month } = store.getGlobalState().time;
    const forward = store.getRelationships(recruiterId).find(e => e.target === targetId);
    const reverse = store.getRelationships(targetId).find(e => e.target === recruiterId);
    if (forward || reverse) {
        // 기존 엣지 감소 (양방향 사본 모두 동기화)
        for (const edge of [forward, reverse]) {
            if (!edge)
                continue;
            edge.affinity = Math.max(-100, edge.affinity + RECRUIT_FAILURE_AFFINITY_DROP);
            edge.history.push({ year, month, event: RECRUIT_FAILED_EVENT, delta: RECRUIT_FAILURE_AFFINITY_DROP });
        }
    }
    else {
        store.addRelationship({
            source: recruiterId,
            target: targetId,
            type: 'FRIEND',
            affinity: RECRUIT_FAILURE_AFFINITY_DROP,
            history: [{ year, month, event: RECRUIT_FAILED_EVENT, delta: RECRUIT_FAILURE_AFFINITY_DROP }],
        });
    }
}
/**
 * 우호도 기반 등용 성공률 보정값 조회 [C-인간관계]
 * affinity +30 이상 → +15%p, −30 이하 → −15%p (클램프)
 */
export function getRecruitAffinityModifier(store, recruiterId, targetId) {
    const edge = findEdgeBetween(store, recruiterId, targetId);
    if (!edge)
        return 0;
    const modifier = edge.affinity / AFFINITY_TO_CHANCE_FACTOR;
    return Math.max(-MODIFIER_CLAMP, Math.min(MODIFIER_CLAMP, modifier));
}
//# sourceMappingURL=recruit_relation_system.js.map