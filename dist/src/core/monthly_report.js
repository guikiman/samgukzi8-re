/**
 * 월간 보고서 [E1-361 연계] — 월말 정산 후 수입/지출/AI 행동 요약
 * + 포팅 시스템 월간 동향 섹션 [76-85][321-340][341-360][421-438]
 */
/**
 * 도시 → 기후 지역 매핑 [321-340]
 * 거점의 지리적 위치(위도/강수)에 따라 4개 기후권으로 배정.
 * 도시명에 지역 키워드가 포함되면 해당 기후권, 그 외에는 지도 좌표로 결정.
 */
export function resolveCityClimateRegion(cityName, mapX, mapY) {
    if (cityName.includes('北') || cityName.includes('북')
        || /딥|평강|계교|북평|양원|천리석/.test(cityName))
        return 'NORTHERN_FRONTIER';
    if (/건업|오|회계|여강|장사|계양|영릉|서창|교지|남해|교주/.test(cityName))
        return 'SOUTHERN_JUNGLE';
    if (/하비|서주|패|소패|광릉|회남|수춘|합비|여남|汝/.test(cityName))
        return 'RIVERLANDS';
    if (mapX !== undefined && mapY !== undefined) {
        // 지도 좌표 기반: y 상단(북방) 1/3 → 북방, 하단 1/3 → 남방, x 우측(동남) 1/3 → 하류
        if (mapY < 0.34)
            return 'NORTHERN_FRONTIER';
        if (mapY > 0.72)
            return 'SOUTHERN_JUNGLE';
        if (mapX > 0.72)
            return 'RIVERLANDS';
    }
    return 'CENTRAL_PLAINS';
}
export class MonthlyReportSystem {
    constructor(store, 
    /** 엔진이 수집한 최근 월간 포팅 시스템 요약 peek (없으면 섹션 생략) */
    portedProvider) {
        this.store = store;
        this.portedProvider = portedProvider;
    }
    generate() {
        const gs = this.store.getGlobalState();
        const playerFactionId = gs.playerFactionId;
        const playerFaction = playerFactionId ? this.store.getFaction(playerFactionId) : null;
        const playerCities = playerFactionId ? this.store.getCitiesByFaction(playerFactionId) : [];
        return {
            year: gs.time.year,
            month: gs.time.month,
            turnCount: gs.turnCount,
            playerGold: playerFaction?.gold ?? 0,
            playerFood: playerFaction?.food ?? 0,
            goldIncome: playerCities.reduce((s, c) => s + c.goldIncome, 0),
            foodIncome: playerCities.reduce((s, c) => s + c.foodIncome, 0),
            cities: playerCities.map(c => ({
                name: c.name,
                funds: c.funds,
                development: c.development,
                commerce: c.developmentStats.commerce,
                farming: c.developmentStats.farming,
            })),
            factions: this.store.getAllFactions()
                .filter(f => f.id !== playerFactionId)
                .map(f => ({
                name: f.name,
                gold: f.gold,
                cities: this.store.getCitiesByFaction(f.id).length,
                officers: this.store.getAllOfficers().filter(o => o.factionId === f.id).length,
            })),
            ported: this.portedProvider?.() ?? null,
        };
    }
}
//# sourceMappingURL=monthly_report.js.map