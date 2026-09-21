/**
 * 증원 시스템 [86/107] — 인접 아군 도시 지원군
 *
 * 공성전이 벌어지는 방어 도시에 대해 인접(직선거리 기준) 아군 도시가
 * 병력·무장을 지원하는 시스템. 플레이어 출진과 AI 공성 양쪽에서 사용한다.
 *
 * 도시 간 인접 판정은 전도 좌표(mapX/mapY) 유클리드 거리로 하며,
 * CITY_MAP_COORDS에 없는 도시(커스텀 모드 등)는 배제한다.
 */
/** 도시 간 거리 단위(px) — 이 거리 이하를 "인접"으로 본다 */
const ADJACENT_DISTANCE = 220;
/** 도시 좌표 테이블 (scenario_system의 CITY_MAP_COORDS와 동일 기준) */
const CITY_MAP_COORDS = {
    허창: { x: 560, y: 130 },
    업: { x: 505, y: 90 },
    낙양: { x: 500, y: 160 },
    거록: { x: 570, y: 55 },
    하내: { x: 440, y: 120 },
    상당: { x: 425, y: 75 },
    진류: { x: 590, y: 185 },
    여남: { x: 580, y: 250 },
    서주: { x: 690, y: 190 },
    하비: { x: 705, y: 130 },
    복양: { x: 630, y: 110 },
    평원: { x: 665, y: 60 },
    건업: { x: 775, y: 230 },
    오: { x: 790, y: 280 },
    회계: { x: 810, y: 340 },
    시상: { x: 740, y: 355 },
    무창: { x: 620, y: 330 },
    강릉: { x: 555, y: 330 },
    장사: { x: 600, y: 400 },
    무릉: { x: 520, y: 395 },
    성도: { x: 230, y: 300 },
    자동: { x: 300, y: 275 },
    강주: { x: 330, y: 360 },
    한중: { x: 330, y: 170 },
    천수: { x: 230, y: 150 },
    무도: { x: 295, y: 115 },
    남양: { x: 500, y: 225 },
    신야: { x: 545, y: 265 },
    강하: { x: 620, y: 275 },
    수춘: { x: 660, y: 210 },
};
/** 두 도시가 인접한지 (거리 기반) */
export function areCitiesAdjacent(cityAId, cityBId) {
    const a = CITY_MAP_COORDS[cityAId];
    const b = CITY_MAP_COORDS[cityBId];
    if (!a || !b || cityAId === cityBId)
        return false;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) <= ADJACENT_DISTANCE;
}
/** 방어 도시에 증원 가능한 인접 아군 도시 목록 */
export function getAdjacentFriendlyCities(defenseCityId, ownerId, cities) {
    return cities.filter((c) => c.id !== defenseCityId &&
        c.ownerId === ownerId &&
        areCitiesAdjacent(defenseCityId, c.id));
}
/**
 * 인접 아군 도시들로부터 지원군을 편성한다.
 *
 * 파견 규칙:
 *  - 각 아군 도시는 보유 병력의 50%를 지원 (최소 200 필요)
 *  - 무장은 최대 2명 파견, 도시에 최소 1명은 남긴다
 *  - 파견 무장은 통솔 높은 순으로 선발
 */
export function assembleReinforcements(defenseCityId, ownerId, cities, officers, armies = []) {
    const contingents = [];
    let totalTroops = 0;
    const sources = getAdjacentFriendlyCities(defenseCityId, ownerId, cities);
    for (const src of sources) {
        // ① 도시 주둔 병력 우선 (도시 troops 개념이 없어 offcerIds 기반 부대에서 산출)
        // 도시에 주둔하는 부대(armies)의 병력 합산
        const cityArmies = armies.filter((a) => a.originCityId === src.id || a.targetCityId === src.id);
        let troops = cityArmies.reduce((sum, a) => sum + a.soldiers, 0);
        // 부대가 없으면 인구 기반 소규모 지원군 (최소 보충병)
        if (troops === 0) {
            const garrison = officers.filter((o) => o.cityId === src.id && o.factionId === ownerId);
            if (garrison.length === 0)
                continue;
            troops = Math.floor(src.population * 0.02); // 인구의 2%를 증원병으로
            if (troops < 200)
                continue; // 최소 증원 규모 미달
        }
        // ② 무장은 통솔 높은 순으로 최대 2명 파견, 도시에 최소 1명은 남긴다
        const stationed = officers
            .filter((o) => o.cityId === src.id && o.factionId === ownerId)
            .sort((a, b) => b.stats.leadership - a.stats.leadership);
        if (stationed.length === 0)
            continue;
        const dispatchCount = Math.min(2, Math.max(0, stationed.length - 1));
        const dispatched = stationed.slice(0, dispatchCount);
        contingents.push({
            sourceCityId: src.id,
            troops,
            officerIds: dispatched.map((o) => o.id),
        });
        totalTroops += troops;
    }
    return {
        defenseCityId,
        totalTroops,
        contingents,
        officerIds: contingents.flatMap((c) => c.officerIds),
    };
}
/** 도시가 다른 도시와 맞닿아 있는지 (공격 측에서 출진 가능 대상 판정용) */
export function canAttackFrom(fromCityId, toCityId) {
    return areCitiesAdjacent(fromCityId, toCityId);
}
//# sourceMappingURL=reinforcement_system.js.map