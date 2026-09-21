/**
 * 포로 탈출/구출 시스템 [131-145: 전투 심화]
 *
 * processBattleSpoils가 포획한 포로는 공격자 도시에 수용된다(imprisonCaptive).
 * 이 시스템은 그 이후의 생애 주기를 담당한다:
 *  - 월간 자의 탈출 판정: 지력이 높을수록 탈출 확률 상승 (기본 15% + 지력 보정, 최대 50%)
 *  - 구출(석방): 수용 도시가 다른 세력에게 함락되면 그 도시의 포로는 모두 석방된다
 *
 * 포로 판별은 Officer 자기-엣지(self edge)의 history 마커로 한다:
 *   CAPTURED → ESCAPED/RESCUED 순서로 마지막 마커가 CAPTURED이고
 *   상태가 FREE + 무소속 + 충성도 0이면 포로로 간주한다.
 * (Officer 인터페이스 변경 없이 세이브 호환성 유지)
 */
import { OfficerStatus } from './types.js';
export const CAPTURE_MARKER_EVENT = 'CAPTURED';
export const ESCAPE_EVENT = 'ESCAPED';
export const RELEASE_EVENT = 'RESCUED';
/** 월간 기본 탈출 확률 */
export const BASE_ESCAPE_CHANCE = 0.15;
/** 지력 탈출 보정 계수 (지력 100 → +15%p) */
const INT_ESCAPE_FACTOR = 0.0015;
/** 탈출 확률 상한 */
const MAX_ESCAPE_CHANCE = 0.5;
/** 마지막 포로 관련 마커 이벤트 조회 (자기-엣지 history 기준) */
function lastCaptiveEvent(store, officerId) {
    const edge = store.getRelationships(officerId).find(e => e.source === officerId && e.target === officerId);
    if (!edge)
        return null;
    const markers = edge.history.filter(h => h.event === CAPTURE_MARKER_EVENT || h.event === ESCAPE_EVENT || h.event === RELEASE_EVENT);
    return markers.length > 0 ? markers[markers.length - 1].event : null;
}
/** 포로 여부 판별 — FREE + 무소속 + 충성도 0 + 마지막 마커가 CAPTURED */
export function isCaptive(store, officerId) {
    const o = store.getOfficer(officerId);
    if (!o)
        return false;
    if (o.status !== OfficerStatus.FREE || o.factionId !== null || o.loyalty !== 0)
        return false;
    return lastCaptiveEvent(store, officerId) === CAPTURE_MARKER_EVENT;
}
/** 포획 직후 호출 — 포로를 공격자(수용) 도시에 배치하고 포로 마커를 남긴다 */
export function imprisonCaptive(store, officerId, holdingCityId) {
    const officer = store.getOfficer(officerId);
    if (!officer || !store.getCity(holdingCityId))
        return;
    store.updateOfficer(officerId, { cityId: holdingCityId });
    // 자기-엣지가 없으면 생성 (addRelationship이 역방향 사본도 인덱스에 추가하지만 self-edge라 무해)
    let selfEdge = store.getRelationships(officerId).find(e => e.source === officerId && e.target === officerId);
    if (!selfEdge) {
        store.addRelationship({
            source: officerId,
            target: officerId,
            type: 'FRIEND',
            affinity: 0,
            history: [],
        });
        selfEdge = store.getRelationships(officerId).find(e => e.source === officerId && e.target === officerId);
    }
    if (!selfEdge)
        return;
    const { year, month } = store.getGlobalState().time;
    selfEdge.history.push({ year, month, event: CAPTURE_MARKER_EVENT, delta: 0 });
}
/** 마커 해제 — 탈출/석방 시점에 이력을 남긴다 */
function releaseMarker(store, officerId, event) {
    const selfEdge = store.getRelationships(officerId).find(e => e.source === officerId && e.target === officerId);
    if (!selfEdge)
        return;
    const { year, month } = store.getGlobalState().time;
    selfEdge.history.push({ year, month, event, delta: 0 });
}
/** 탈출 확률 계산 (순수 함수) — 지력이 높을수록 탈출에 유리 */
export function judgeEscape(intelligence, roll) {
    const chance = Math.min(MAX_ESCAPE_CHANCE, BASE_ESCAPE_CHANCE + intelligence * INT_ESCAPE_FACTOR);
    return roll < chance;
}
/**
 * 월간 포로 이벤트 — 자의 탈출 판정.
 * 엔진의 월간 주기(배신 판정 근처)에서 호출한다.
 */
export function processMonthlyCaptiveEvents(store) {
    const escaped = [];
    const messages = [];
    const captives = store.getAllOfficers().filter(o => isCaptive(store, o.id));
    for (const c of captives) {
        if (!judgeEscape(c.stats.intelligence, Math.random()))
            continue;
        const fromCityId = c.cityId;
        releaseMarker(store, c.id, ESCAPE_EVENT);
        store.updateOfficer(c.id, { cityId: null });
        const record = {
            officerId: c.id,
            officerName: c.name,
            fromCityId,
            message: `🏃 ${c.name}이(가) 포로수용소에서 탈출했습니다`,
        };
        escaped.push(record);
        messages.push(record.message);
    }
    return { escaped, messages };
}
/**
 * 구출(석방) — 수용 도시가 함락됐을 때 그 도시의 포로를 모두 석방한다.
 * 함락 소유권 변경 직후(플레이어 원정 승리 / AI 공성 승리)에 호출.
 * 석방된 포로는 그 도시에 재야로 남는다 (새 소유자가 등용 가능).
 */
export function releaseCaptivesInCity(store, cityId) {
    const released = [];
    for (const o of store.getOfficersByCity(cityId)) {
        if (!isCaptive(store, o.id))
            continue;
        releaseMarker(store, o.id, RELEASE_EVENT);
        released.push({
            officerId: o.id,
            officerName: o.name,
            fromCityId: cityId,
            message: `🔓 ${o.name} 석방 — 수용 도시가 함락되었습니다`,
        });
    }
    return released;
}
/** 특정 도시에 수용 중인 포로 목록 (UI 배지용) */
export function getCaptivesInCity(store, cityId) {
    return store.getOfficersByCity(cityId)
        .filter(o => isCaptive(store, o.id))
        .map(o => ({ id: o.id, name: o.name }));
}
//# sourceMappingURL=captive_escape_system.js.map