/**
 * [91] 선물 기호 매칭 엔진 — GiftingPreferenceEngine
 * 
 * 목적: 장수의 취향에 따른 선물 효과 판정.
 */
export class GiftingPreferenceEngine {
    public getAffectionBonus(officer: any, treasure: any): number {
        console.log(`[Social] ${officer.name}에게 ${treasure.name} 선물.`);
        return officer.favType === treasure.type ? 20 : 5;
    }
}
