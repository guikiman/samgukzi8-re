/**
 * [36] 민정 상소 해결 미니루프 — CivilPetitionManager
 * 
 * 목적: 백성들의 민원을 해결하고 명성/오명 판정.
 */
export class CivilPetitionManager {
    public resolvePetition(petitionType: string, choice: 'ACCEPT' | 'REJECT'): { fameDelta: number } {
        console.log(`[Civil] 민정 ${petitionType} 처리됨.`);
        return { fameDelta: choice === 'ACCEPT' ? 10 : -5 };
    }
}
