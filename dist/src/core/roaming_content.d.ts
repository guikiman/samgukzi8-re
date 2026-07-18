/**
 * [6] 방랑군 거점 전술 '보급망 약탈 기습'
 *
 * RoamingContentSystem:
 *   - monitorSupplyRoutes(): 인접 대형 세력들의 수송로 타일 실시간 모니터링
 *   - triggerSupplyRaid(): 방랑군 군세로 적 세입 보급대를 습격해 골드/군량 강탈
 *   - computeRaidOutcome(): 약탈 성공/실패 판정 (은밀성 vs 경비)
 */
import type { FactionID, CityID, IGameStore } from './types.js';
export interface SupplyRoute {
    readonly fromCityId: CityID;
    readonly toCityId: CityID;
    readonly factionId: FactionID;
    readonly goldAmount: number;
    readonly foodAmount: number;
    readonly guardLevel: number;
}
export interface RaidOutcome {
    readonly success: boolean;
    readonly goldStolen: number;
    readonly foodStolen: number;
    readonly casualties: number;
    readonly stealthUsed: number;
}
export declare class RoamingContentSystem {
    private readonly store;
    constructor(store: IGameStore);
    /**
     * [6] 인접 대형 세력 수송로 모니터링
     *
     * 방랑군(무소속) 상태에서 인접 도시 간 보급로를 탐지
     */
    monitorSupplyRoutes(playerOfficerId: string): SupplyRoute[];
    /**
     * [6] 보급망 약탈 기습 실행
     *
     * 성공 확률 = 은밀성(stealth) × (1 - guardLevel/100)
     * 성공 시: goldStolen = route.goldAmount × (0.5~1.5)
     * 실패 시: 피해 발생
     */
    triggerSupplyRaid(route: SupplyRoute, stealth: number): RaidOutcome;
    /** 인접 도시 목록 조회 (더미 — 실제 구현 시 맵 그래프 기반) */
    private getNeighborCities;
}
//# sourceMappingURL=roaming_content.d.ts.map