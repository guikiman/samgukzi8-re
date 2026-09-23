/**
 * 월간 보고서 [E1-361 연계] — 월말 정산 후 수입/지출/AI 행동 요약
 * + 포팅 시스템 월간 동향 섹션 [76-85][321-340][341-360][421-438]
 */
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