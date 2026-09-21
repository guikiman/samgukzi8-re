/**
 * 의형제 결의 시스템 [C-인간관계] [25]
 *
 * 우호도가 깊은 두 무장이 의형제를 맺는다:
 *  - 조건: 양방향 우호도 70 이상 + 같은 세력(또는 한쪽 재야) + 둘 다 생존
 *  - 월간 자동 판정: 조건을 충족하는 최상위 쌍 중 확률로 결의
 *  - 효과: SWORN_BROTHER 엣지 생성 (우호도 90으로 초기화)
 *    + 세력 평판 상승 (의리의 상징) + 결의 축하 로그
 *
 * 의형제가 되면 sworn_brother_rescue_system의 구출 대상이 되고,
 * 복수 이벤트와 함께 인과 사이클을 형성한다.
 */
import { OfficerStatus } from './types.js';
/** 의형제 결의 최소 우호도 */
export const PACT_MIN_AFFINITY = 70;
/** 월간 결의 확률 (조건 충족 쌍 1개당) */
export const PACT_MONTHLY_CHANCE = 0.35;
/** 결의 시 세력 평판 상승량 */
export const PACT_REPUTATION_BONUS = 3;
/** 결의 시 설정되는 우호도 */
export const PACT_AFFINITY_SET = 90;
/** 이미 의형제인지 */
function alreadySworn(store, aId, bId) {
    const forward = store.getRelationships(aId).find(e => e.target === bId && e.type === 'SWORN_BROTHER');
    const reverse = store.getRelationships(bId).find(e => e.target === aId && e.type === 'SWORN_BROTHER');
    return !!(forward || reverse);
}
/**
 * 의형제 결의 가능 쌍 탐색 — 순수 조회 (사이드 이펙트 없음)
 * 조건: 양방향 우호도 70+ / 둘 다 생존 / 같은 세력 또는 한쪽 재야 / 기존 의형제 아님
 */
export function findPactCandidates(store, minAffinity = PACT_MIN_AFFINITY) {
    const officers = store.getAllOfficers().filter(o => o.runtime.isAlive
        && (o.status !== OfficerStatus.FREE || o.factionId === null)
        && (o.status === OfficerStatus.FREE ? o.factionId === null : true)).slice(0, 300);
    const candidates = [];
    const seen = new Set();
    for (const a of officers) {
        for (const b of officers) {
            if (a.id >= b.id)
                continue; // 중복 쌍 제거 (정렬 키)
            const key = `${a.id}|${b.id}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            if (alreadySworn(store, a.id, b.id))
                continue;
            // 같은 세력 또는 한쪽 재야
            const sameFaction = a.factionId !== null && a.factionId === b.factionId;
            const oneFree = a.factionId === null || b.factionId === null;
            if (!sameFaction && !oneFree)
                continue;
            if (a.factionId !== null && b.factionId !== null && a.factionId !== b.factionId)
                continue;
            const forward = store.getRelationships(a.id).find(e => e.target === b.id);
            const reverse = store.getRelationships(b.id).find(e => e.target === a.id);
            const affinity = Math.min(forward?.affinity ?? 0, reverse?.affinity ?? 0);
            if (affinity < minAffinity)
                continue;
            candidates.push({ aId: a.id, bId: b.id, affinity });
        }
    }
    // 우호도 높은 순
    candidates.sort((x, y) => y.affinity - x.affinity);
    return candidates;
}
/**
 * 의형제 결의 실행 — 엣지 생성 + 세력 평판 상승
 */
export function executeSwornBrotherPact(store, aId, bId) {
    const a = store.getOfficer(aId);
    const b = store.getOfficer(bId);
    if (!a || !b)
        return null;
    if (alreadySworn(store, aId, bId))
        return null;
    // SWORN_BROTHER 엣지 생성 — PACT_AFFINITY_SET으로 초기화
    const { year, month } = store.getGlobalState().time;
    const history = [{ year, month, event: 'SWORN_BROTHER_PACT', delta: 0 }];
    store.addRelationship({
        source: aId,
        target: bId,
        type: 'SWORN_BROTHER',
        affinity: PACT_AFFINITY_SET,
        history,
    });
    // 세력 평판 상승 (같은 세력 결의만 — 재야는 해당 없음)
    const factionId = a.factionId ?? b.factionId;
    if (factionId) {
        const faction = store.getFaction(factionId);
        if (faction) {
            store.updateFaction(factionId, { reputation: Math.min(100, faction.reputation + PACT_REPUTATION_BONUS) });
        }
    }
    return {
        officerAId: aId,
        officerAName: a.name,
        officerBId: bId,
        officerBName: b.name,
        factionId: factionId ?? null,
        message: `🤙 ${a.name}과(와) ${b.name}이(가) 의형제를 맺었습니다! (의리의 평판 상승)`,
    };
}
/**
 * 월간 의형제 결의 판정 — 엔진 월간 주기에서 호출.
 * 조건 충족 쌍 중 최상위 1개만 확률적으로 결의 (월 1회 제한).
 */
export function processMonthlySwornBrotherPacts(store) {
    const messages = [];
    const candidates = findPactCandidates(store);
    if (candidates.length === 0)
        return { pacts: [], messages };
    // 최상위 쌍만 확률 판정
    const top = candidates[0];
    if (Math.random() >= PACT_MONTHLY_CHANCE) {
        return { pacts: [], messages };
    }
    const record = executeSwornBrotherPact(store, top.aId, top.bId);
    if (!record)
        return { pacts: [], messages };
    messages.push(record.message);
    return { pacts: [record], messages };
}
//# sourceMappingURL=sworn_brother_pact_system.js.map