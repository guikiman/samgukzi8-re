/**
 * [41] 세작 파견 및 정보 수집기 — SpyManager
 * 
 * 목적: 적대 세력의 군사 정보 수집.
 */
export class SpyManager {
    public gatherInfo(targetCityId: string): any {
        console.log(`[Spy] ${targetCityId} 정보 수집 완료.`);
        return { armySize: 5000, morale: 80 };
    }
}
