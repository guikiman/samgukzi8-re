/**
 * [6] 방랑군 거점 전술 '보급망 약탈 기습'
 *
 * RoamingContentSystem:
 *   - monitorSupplyRoutes(): 인접 대형 세력들의 수송로 타일 실시간 모니터링
 *   - triggerSupplyRaid(): 방랑군 군세로 적 세입 보급대를 습격해 골드/군량 강탈
 *   - computeRaidOutcome(): 약탈 성공/실패 판정 (은밀성 vs 경비)
 */
export class RoamingContentSystem {
    constructor(store) {
        this.store = store;
    }
    /**
     * [6] 인접 대형 세력 수송로 모니터링
     *
     * 방랑군(무소속) 상태에서 인접 도시 간 보급로를 탐지
     */
    monitorSupplyRoutes(playerOfficerId) {
        const player = this.store.getOfficer(playerOfficerId);
        if (!player || player.factionId)
            return []; // 세력 소속이면 방랑군 아님
        const routes = [];
        const allCities = this.store.getAllCities();
        for (const city of allCities) {
            if (!city.ownerId)
                continue;
            const faction = this.store.getFaction(city.ownerId);
            if (!faction)
                continue;
            const neighbors = this.getNeighborCities(city.id);
            for (const neighbor of neighbors) {
                if (neighbor.ownerId !== city.ownerId)
                    continue;
                const guardLevel = Math.min(100, Math.floor(faction.officers.length * 5));
                routes.push({
                    fromCityId: city.id,
                    toCityId: neighbor.id,
                    factionId: city.ownerId,
                    goldAmount: Math.floor(faction.gold / 20),
                    foodAmount: Math.floor(faction.food / 20),
                    guardLevel,
                });
            }
        }
        return routes;
    }
    /**
     * [6] 보급망 약탈 기습 실행
     *
     * 성공 확률 = 은밀성(stealth) × (1 - guardLevel/100)
     * 성공 시: goldStolen = route.goldAmount × (0.5~1.5)
     * 실패 시: 피해 발생
     */
    triggerSupplyRaid(route, stealth) {
        const successChance = stealth * (1 - route.guardLevel / 100);
        const roll = Math.random();
        if (roll < successChance) {
            const multiplier = 0.5 + Math.random();
            return {
                success: true,
                goldStolen: Math.floor(route.goldAmount * multiplier),
                foodStolen: Math.floor(route.foodAmount * multiplier),
                casualties: Math.floor(Math.random() * 20),
                stealthUsed: stealth,
            };
        }
        return {
            success: false,
            goldStolen: 0,
            foodStolen: 0,
            casualties: Math.floor(Math.random() * 50) + 10,
            stealthUsed: stealth,
        };
    }
    /** 인접 도시 목록 조회 (더미 — 실제 구현 시 맵 그래프 기반) */
    getNeighborCities(cityId) {
        const city = this.store.getCity(cityId);
        if (!city)
            return [];
        return city.neighbors?.map((nid) => this.store.getCity(nid)).filter(Boolean) ?? [];
    }
}
//# sourceMappingURL=roaming_content.js.map