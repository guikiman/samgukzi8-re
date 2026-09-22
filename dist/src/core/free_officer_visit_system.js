/**
 * 재야 무장 방문 시스템 [24][421-440] — 자발적 출사 타진
 *
 * 재야(FREE) 무장이 매월 확률적으로 세력 도시를 방문해 직접 등용을 타진한다:
 *  - 방문 확률: 기본 30% × (무장 야망/100) × 명성 가중
 *  - 대상 세력: 무장이 위치한 도시의 소유 세력 (재야는 자기 도시에 머무른다)
 *  - 수락 판정: 군주 매력 기반 호감 + 군주 명성 보정
 *  - 수락: 해당 세력으로 입사 (충성도 초기값은 군주 명성에 비례)
 *  - 거절: 재야 유지, 다음 달 재타진 가능
 *
 * 플레이어 세력 도시 방문은 UI 선택지(맞이하기/사절하기)로 넘기고,
 * AI 세력 도시 방문은 자동 판정한다. roll 주입으로 결정적 테스트를 지원한다.
 */
import { OfficerStatus } from './types.js';
import { scaleVisitChance } from './difficulty_balance_system.js';
/** 성격 유형 표시 라벨 [481-500] */
const PERSONALITY_LABELS = {
    AGGRESSIVE: '공전심',
    CALM: '냉정',
    CAUTIOUS: '신중',
    TIMID: '소심',
    LOYAL: '의리',
    AMBITIOUS: '야망가',
    RIGHTEOUS: '의협심',
    GREEDY: '탐욕',
};
/** 기본 방문 확률 */
export const BASE_VISIT_CHANCE = 0.3;
/** 명성 가중 — 명성 500 이상이면 확률 1.5배 (상한) */
export const FAME_WEIGHT_MAX = 1.5;
/** 수락 기본 확률 — 군주 매력 60 기준 */
export const BASE_ACCEPT_CHANCE = 0.45;
/** 수락 확률 상한 */
export const MAX_ACCEPT_CHANCE = 0.9;
/** 재야 무장의 월간 출사 타진 판정. 엔진 월간 주기에서 호출.
 *  @param random 확률 판정용 난수 생성기 (테스트에서 결정적 시퀀스 주입) */
export function processMonthlyFreeOfficerVisits(store, random = Math.random) {
    const visits = [];
    const free = store.getAllOfficers().filter(o => o.status === OfficerStatus.FREE && o.runtime.isAlive && o.cityId !== null);
    for (const officer of free) {
        const city = store.getCity(officer.cityId);
        if (!city || !city.ownerId)
            continue;
        const faction = store.getFaction(city.ownerId);
        if (!faction)
            continue;
        // 방문 확률: 기본 30% × 야망/100 × 명성 가중 × 난이도 빈도 배율 [X-난이도]
        const fameWeight = Math.min(FAME_WEIGHT_MAX, 1 + officer.fame / 1000);
        const visitChance = Math.min(1, scaleVisitChance(BASE_VISIT_CHANCE, store) * (officer.ambition / 100) * fameWeight);
        const visitRoll = random();
        if (visitRoll >= visitChance)
            continue;
        const leader = store.getOfficer(faction.leaderId);
        const leaderCharisma = leader?.stats.charisma ?? 50;
        const leaderFame = leader?.fame ?? 0;
        // 수락 확률: 기본 45% + 군주 매력 보정(매력 60 기준 ±) + 군주 명성 보정(최대 +10%p)
        const acceptChance = Math.min(MAX_ACCEPT_CHANCE, BASE_ACCEPT_CHANCE + (leaderCharisma - 60) * 0.005 + Math.min(0.1, leaderFame / 3000));
        const needsPlayerChoice = faction.isPlayerControlled;
        let joined = false;
        let message = '';
        if (needsPlayerChoice) {
            // 플레이어 세력 — UI 선택지로 넘김 (맞이하기/사절하기)
            message = `🚶 재야 무장 ${officer.name}이(가) ${city.name}을(를) 방문해 출사를 타진합니다 (수락 확률 ${Math.round(acceptChance * 100)}%)`;
        }
        else {
            // AI 세력 — 자동 판정
            const acceptRoll = random();
            joined = acceptRoll < acceptChance;
            if (joined) {
                applyJoin(store, officer.id, faction.id, city.id, leaderFame);
                message = `🤝 재야 무장 ${officer.name}이(가) ${faction.name}에 자발적으로 출사했습니다`;
            }
            else {
                message = `🚪 재야 무장 ${officer.name}의 출사 타진이 거절되었습니다 (${faction.name})`;
            }
        }
        visits.push({
            officerId: officer.id,
            officerName: officer.name,
            cityId: city.id,
            cityName: city.name,
            factionId: faction.id,
            factionName: faction.name,
            leaderId: leader?.id ?? null,
            leaderName: leader?.name ?? null,
            chance: acceptChance,
            roll: visitRoll,
            joined,
            needsPlayerChoice,
            message,
            stats: { ...officer.stats },
            ambition: officer.ambition,
            fame: officer.fame,
            personalityLabel: PERSONALITY_LABELS[officer.personality] ?? officer.personality,
        });
    }
    return visits;
}
/** 수락 적용 — 세력 입사 + 도시 배치 + 충성도 초기화 (명성 비례) */
export function applyJoin(store, officerId, factionId, cityId, leaderFame) {
    const officer = store.getOfficer(officerId);
    if (!officer)
        return;
    const initialLoyalty = Math.min(100, 60 + Math.floor(leaderFame / 100));
    store.updateOfficer(officerId, {
        status: OfficerStatus.OFFICER,
        factionId,
        loyalty: initialLoyalty,
        runtime: { ...officer.runtime, factionId, locationId: cityId, loyalty: initialLoyalty },
    });
    const faction = store.getFaction(factionId);
    if (faction && !faction.officers.includes(officer.id)) {
        store.updateFaction(factionId, { officers: [...faction.officers, officer.id] });
    }
    const city = store.getCity(cityId);
    if (city && !city.officerIds.includes(officer.id)) {
        store.updateCity(cityId, { officerIds: [...city.officerIds, officer.id] });
    }
}
/** 플레이어 선택 — 맞이하기 */
export function acceptVisit(store, visit) {
    if (visit.factionId && visit.cityId) {
        const leader = visit.leaderId ? store.getOfficer(visit.leaderId) : null;
        applyJoin(store, visit.officerId, visit.factionId, visit.cityId, leader?.fame ?? 0);
    }
    visit.joined = true;
    visit.message = `🤝 재야 무장 ${visit.officerName}을(를) 맞이했습니다 — ${visit.factionName ?? ''} 입사`;
    return visit;
}
/** 플레이어 선택 — 사절하기 (재야 유지) */
export function declineVisit(visit) {
    visit.joined = false;
    visit.message = `🚪 재야 무장 ${visit.officerName}의 출사 타진을 사절했습니다`;
    return visit;
}
//# sourceMappingURL=free_officer_visit_system.js.map