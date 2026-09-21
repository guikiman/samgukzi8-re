/**
 * 의형제 구원 시스템 [C-인간관계] [131-145]
 *
 * SWORN_BROTHER(의형제) 관계인 무장이 포로로 수용되면, 같은 세력(또는 재야)의
 * 의형제가 매월 구출을 시도한다:
 *  - 구출 성공: 포로가 의형제의 도시로 탈출 (도주 없이 무사히 합류)
 *  - 구출 실패: 포로는 계속 수용 (탈출 판정은 captive_escape_system이 담당)
 *
 * 성공 확률: 기본 25% + 의형제 무력 보정(최대 +25%) — 힘으로 빼내는 구조.
 * 성공 시 의형제 간 우호도 +30 (형제의 의리 확인).
 */

import type { GameStore } from './game_store.js';
import { OfficerStatus } from './types.js';
import { isCaptive } from './captive_escape_system.js';

/** 월간 기본 구출 확률 */
export const BASE_RESCUE_CHANCE = 0.25;

/** 무력 구출 보정 계수 (무력 100 → +25%p) */
const MIGHT_RESCUE_FACTOR = 0.0025;

/** 구출 확률 상한 */
export const MAX_RESCUE_CHANCE = 0.7;

/** 구출 성공 시 우호도 상승량 */
export const RESCUE_AFFINITY_BONUS = +30;

/** 관계 이력 이벤트명 */
export const RESCUE_EVENT = 'SWORN_BROTHER_RESCUE';

/**
 * 의형제 관계 엣지 조회 (양방향, SWORN_BROTHER 타입만)
 */
function findSwornBrotherEdge(store: GameStore, aId: string, bId: string) {
    const forward = store.getRelationships(aId).find(e => e.target === bId && e.type === 'SWORN_BROTHER');
    const reverse = store.getRelationships(bId).find(e => e.target === aId && e.type === 'SWORN_BROTHER');
    return forward ?? reverse ?? null;
}

/**
 * 두 무장이 의형제인지 확인
 */
export function areSwornBrothers(store: GameStore, aId: string, bId: string): boolean {
    if (aId === bId) return false;
    return findSwornBrotherEdge(store, aId, bId) !== null;
}

/**
 * 특정 포로를 구하려는 의형제 목록 — 생존 + 포로가 아닌 의형제만
 */
export function findRescuers(store: GameStore, captiveId: string): string[] {
    const edges = store.getRelationships(captiveId).filter(e => e.type === 'SWORN_BROTHER' && e.target !== captiveId);
    const rescuers: string[] = [];
    for (const edge of edges) {
        const brother = store.getOfficer(edge.target);
        if (!brother) continue;
        if (!brother.runtime.isAlive) continue;
        if (isCaptive(store, brother.id)) continue; // 구하러 갈 의형제도 포로면 불가
        rescuers.push(brother.id);
    }
    return rescuers;
}

/**
 * 구출 확률 계산 (순수 함수) — 의형제의 무력이 높을수록 유리
 */
export function judgeRescue(might: number, roll: number, chance: number = BASE_RESCUE_CHANCE + might * MIGHT_RESCUE_FACTOR): boolean {
    const clamped = Math.min(MAX_RESCUE_CHANCE, chance);
    return roll < clamped;
}

export interface RescueRecord {
    officerId: string;
    officerName: string;
    rescuerId: string;
    rescuerName: string;
    toCityId: string | null;
    message: string;
}

export interface SwornBrotherRescueReport {
    rescued: RescueRecord[];
    messages: string[];
}

/**
 * 월간 의형제 구출 판정 — 엔진 월간 주기에서 호출.
 * 포로별로 첫 번째 의형제가 구출을 시도한다.
 */
export function processMonthlySwornBrotherRescues(store: GameStore): SwornBrotherRescueReport {
    const rescued: RescueRecord[] = [];
    const messages: string[] = [];

    const captives = store.getAllOfficers().filter(o => isCaptive(store, o.id));
    for (const captive of captives) {
        const rescuers = findRescuers(store, captive.id);
        if (rescuers.length === 0) continue;
        const rescuer = store.getOfficer(rescuers[0])!;

        if (!judgeRescue(rescuer.stats.might, Math.random())) continue;

        // 구출: 포로를 의형제가 속한 도시(소속 세력 수도)로 합류
        const destCityId = rescuer.cityId
            ?? (rescuer.factionId ? store.getCitiesByFaction(rescuer.factionId)[0]?.id ?? null : null);
        if (!destCityId) continue;

        // 포로 해제 마커 (탈출과 동일 처리 — 재시도 대상에서 제외)
        const edge = store.getRelationships(captive.id).find(e => e.source === captive.id && e.target === captive.id);
        const { year, month } = store.getGlobalState().time;
        if (edge) {
            edge.history.push({ year, month, event: 'RESCUED', delta: 0 });
        }

        store.updateOfficer(captive.id, { cityId: destCityId });

        // 의형제 간 우호도 +30 (양방향 동기화)
        const forward = store.getRelationships(rescuer.id).find(e => e.target === captive.id);
        const reverse = store.getRelationships(captive.id).find(e => e.target === rescuer.id);
        for (const fe of [forward, reverse]) {
            if (!fe) continue;
            fe.affinity = Math.max(-100, Math.min(100, fe.affinity + RESCUE_AFFINITY_BONUS));
            fe.history.push({ year, month, event: RESCUE_EVENT, delta: RESCUE_AFFINITY_BONUS });
        }

        const record: RescueRecord = {
            officerId: captive.id,
            officerName: captive.name,
            rescuerId: rescuer.id,
            rescuerName: rescuer.name,
            toCityId: destCityId,
            message: `🤝 ${rescuer.name}이(가) 의형제 ${captive.name}을(를) 구출했습니다! (${store.getCity(destCityId)?.name ?? '?'} 합류)`,
        };
        rescued.push(record);
        messages.push(record.message);
    }

    return { rescued, messages };
}
