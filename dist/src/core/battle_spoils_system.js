/**
 * 전투 후처리 시스템 [131-145: 전투 심화] — 포로·약탈
 *
 * 공성 승리 직후 호출되며:
 * 1) 포로 포획: 수비 도시 무장 중 일부를 포획 (포획률은 지력/도주 반영)
 *    - 포획된 무장은 재야화(FREE) + 충성도 0 + 도시에서 이탈 → 등용 시스템의 대상이 됨 [24]
 * 2) 병력 약탈: 수비 도시 병력(development)의 일부를 공격자 도시로 이송
 * 3) 자원 수탈: 수비 도시 자금(funds)과 소속 세력 국고의 일부를 약탈
 *
 * 순수 함수형 계산 + 스토어 적용 분리로 테스트 용이성 확보.
 */
import { OfficerStatus } from './types.js';
/** 포획 확률 기본값 (무장 1명당) */
export const BASE_CAPTURE_CHANCE = 0.35;
/** 지력이 높으면 도주 확률 가산 (지력 100 → +25%p 감소) */
export const INT_ESCAPE_FACTOR = 0.0025;
/** 병력 약탈 비율 (수비 도시 development 기준) */
export const TROOP_PLUNDER_RATIO = 0.25;
/** 자금 약탈 비율 (수비 도시 funds 기준) */
export const FUND_PLUNDER_RATIO = 0.4;
/** 세력 국고 약탈 비율 (수비 세력 gold 기준) */
export const FACTION_GOLD_PLUNDER_RATIO = 0.2;
/**
 * 포획 판정 (순수 함수) — 지력이 높은 무장은 도주 확률이 낮다
 * 포획률 = BASE_CAPTURE_CHANCE - 지력 × 0.0025 (지력 100 → 10%p 감소), 최저 5%
 */
export function judgeCapture(officer, roll) {
    const captureChance = Math.max(0.05, BASE_CAPTURE_CHANCE - officer.stats.intelligence * INT_ESCAPE_FACTOR);
    return roll < captureChance;
}
/**
 * 승리 후 전리품 계산 + 스토어 적용
 *
 * @param attackerCityId 공격자 출발 도시
 * @param defenderCityId 함락된 수비 도시
 * @param rolls 포획 판정용 난수 (무장별 0~1, 테스트 주입용 — 없으면 Math.random)
 */
export function processBattleSpoils(store, attackerCityId, defenderCityId, rolls) {
    const defenderCity = store.getCity(defenderCityId);
    const attackerCity = store.getCity(attackerCityId);
    const messages = [];
    const result = {
        capturedOfficerIds: [],
        escapedOfficerIds: [],
        troopsPlundered: 0,
        fundsPlundered: 0,
        factionGoldPlundered: 0,
        messages,
    };
    if (!defenderCity || !attackerCity)
        return result;
    // 1) 포로 포획 — 수비 도시 주둔 무장 (플레이어/군주 제외 대상 판정은 호출 측 정책에 위임)
    const officers = store.getOfficersByCity(defenderCityId);
    const rollMap = new Map(rolls?.map(r => [r.officerId, r.roll]));
    for (const officer of officers) {
        if (officer.status === OfficerStatus.FREE)
            continue; // 재야 무장은 포로 대상 아님
        const roll = rollMap.get(officer.id) ?? Math.random();
        if (judgeCapture(officer, roll)) {
            // 포획: 재야화 + 충성도 0 + 도시 이탈 (byCity 인덱스도 함께 갱신됨)
            store.updateOfficer(officer.id, {
                factionId: null,
                status: OfficerStatus.FREE,
                rank: 0,
                loyalty: 0,
                cityId: null,
            });
            const city = store.getCity(defenderCityId);
            if (city) {
                store.updateCity(defenderCityId, {
                    officerIds: city.officerIds.filter(id => id !== officer.id),
                });
            }
            const oldOwner = defenderCity.ownerId;
            if (oldOwner) {
                const fac = store.getFaction(oldOwner);
                if (fac) {
                    store.updateFaction(oldOwner, { officers: fac.officers.filter(id => id !== officer.id) });
                }
            }
            result.capturedOfficerIds.push(officer.id);
            messages.push(`⛓️ ${officer.name} 포획! (등용 가능)`);
        }
        else {
            result.escapedOfficerIds.push(officer.id);
        }
    }
    // 2) 병력 약탈
    const troops = Math.floor(defenderCity.development * TROOP_PLUNDER_RATIO);
    if (troops > 0) {
        store.updateCity(defenderCityId, { development: Math.max(0, defenderCity.development - troops) });
        store.updateCity(attackerCityId, { development: attackerCity.development + troops });
        result.troopsPlundered = troops;
        messages.push(`⚔️ 병력 ${troops} 포획`);
    }
    // 3) 자금 약탈 (도시 자금)
    const funds = Math.floor(defenderCity.funds * FUND_PLUNDER_RATIO);
    if (funds > 0) {
        store.updateCity(defenderCityId, { funds: defenderCity.funds - funds });
        store.updateCity(attackerCityId, { funds: attackerCity.funds + funds });
        result.fundsPlundered = funds;
        messages.push(`💰 자금 ${funds} 약탈`);
    }
    // 4) 세력 국고 약탈 (수비 도시 소속 세력이 존재하면)
    const defenderOwnerId = defenderCity.ownerId;
    if (defenderOwnerId) {
        const fac = store.getFaction(defenderOwnerId);
        if (fac && fac.gold > 0) {
            const gold = Math.floor(fac.gold * FACTION_GOLD_PLUNDER_RATIO);
            if (gold > 0) {
                store.updateFaction(defenderOwnerId, { gold: fac.gold - gold });
                const attackerOwner = attackerCity.ownerId;
                if (attackerOwner) {
                    const attackerFac = store.getFaction(attackerOwner);
                    if (attackerFac) {
                        store.updateFaction(attackerOwner, { gold: attackerFac.gold + gold });
                    }
                }
                result.factionGoldPlundered = gold;
                messages.push(`👑 국고 ${gold} 약탈`);
            }
        }
    }
    return result;
}
//# sourceMappingURL=battle_spoils_system.js.map