/**
 * 지옥 난이도 시스템 [X-난이도][E-도시내정]
 *
 * difficulty 5(지옥)에서만 작동하는 추가 제약 — 생존 압박을 극대화한다:
 *  1) 수입 감소: 도시 세수의 20%가 유실 (부패/전란 서사 로그)
 *  2) 저충성 탈영: 충성도 30 이하 무장이 매월 확률적으로 이탈
 *  3) 도시 반란: 치안 30 이하 도시가 확률적으로 소유 세력 변경(재야화)
 *
 * 난이도 1~4에서는 이 시스템이 완전히 비활성화되어 기존 균형 유지.
 * 모든 판정은 random 주입으로 결정적 테스트를 지원.
 */
import { OfficerStatus } from './types.js';
/** 지옥 난이도 임계값 */
export const HELL_DIFFICULTY = 5;
/** 수입 유실률 (0.2 = 20%) */
export const HELL_TAX_LEAK = 0.2;
/** 탈영 대상 충성도 이하 */
export const HELL_DESERTION_LOYALTY = 30;
/** 탈영 확률 (충성도 0 기준, 충성도에 반비례) */
export const HELL_DESERTION_BASE = 0.4;
/** 반란 대상 치안 이하 */
export const HELL_REVOLT_ORDER = 30;
/** 반란 확률 (치안 0 기준, 치안에 반비례) */
export const HELL_REVOLT_BASE = 0.35;
/** 스토어가 지옥 난이도인지 확인 */
export function isHellDifficulty(store) {
    const d = store.getGlobalState().difficulty;
    return typeof d === 'number' && Math.round(d) >= HELL_DIFFICULTY;
}
/**
 * 월간 지옥 제약 판정. 엔진 월간 주기 말미에서 호출.
 * 난이도 5가 아니면 즉시 빈 리포트 반환 (기존 균형 무손상).
 */
export function processHellConstraints(store, random = Math.random) {
    const report = { taxLeaked: 0, deserted: [], revolted: [] };
    if (!isHellDifficulty(store))
        return report;
    // 1) 수입 유실 — 도시 세수 20% 유실 (전란의 부패)
    for (const city of store.getAllCities()) {
        if (!city.ownerId)
            continue;
        const leak = Math.floor(city.goldIncome * HELL_TAX_LEAK);
        if (leak <= 0)
            continue;
        store.updateCity(city.id, { goldIncome: city.goldIncome - leak });
        report.taxLeaked += leak;
    }
    // 2) 저충성 탈영 — 충성도 30 이하 무장 (군주 제외)
    const gs = store.getGlobalState();
    for (const officer of store.getAllOfficers()) {
        if (!officer.factionId || !officer.runtime.isAlive)
            continue;
        const faction = store.getFaction(officer.factionId);
        if (!faction || faction.leaderId === officer.id)
            continue;
        if (officer.loyalty > HELL_DESERTION_LOYALTY)
            continue;
        // 충성도 낮을수록 탈영 확률 상승 (30 기준 0.1, 0 기준 0.4)
        const chance = HELL_DESERTION_BASE * (1 - officer.loyalty / HELL_DESERTION_LOYALTY * 0.75);
        if (random() >= chance)
            continue;
        const cityId = officer.cityId;
        store.updateOfficer(officer.id, {
            factionId: null,
            status: OfficerStatus.FREE,
            cityId: officer.cityId,
        });
        report.deserted.push({
            officerId: officer.id,
            officerName: officer.name,
            cityId: cityId ?? '',
        });
    }
    void gs;
    // 3) 도시 반란 — 치안 30 이하 도시
    for (const city of store.getAllCities()) {
        if (!city.ownerId)
            continue;
        if (city.developmentStats.publicOrder > HELL_REVOLT_ORDER)
            continue;
        const chance = HELL_REVOLT_BASE * (1 - city.developmentStats.publicOrder / HELL_REVOLT_ORDER * 0.7);
        if (random() >= chance)
            continue;
        const faction = store.getFaction(city.ownerId);
        if (!faction)
            continue;
        store.updateCity(city.id, { ownerId: null });
        report.revolted.push({
            cityId: city.id,
            cityName: city.name,
            fromFactionName: faction.name,
        });
    }
    return report;
}
//# sourceMappingURL=hell_constraint_system.js.map