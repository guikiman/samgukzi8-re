/**
 * [91] 선물 기호 매칭 엔진 — GiftingPreferenceEngine
 *
 * 목적: 장수의 취향에 따른 선물 효과 판정.
 */
export class GiftingPreferenceEngine {
    getAffectionBonus(officer, treasure) {
        console.log(`[Social] ${officer.name}에게 ${treasure.name} 선물.`);
        return officer.favType === treasure.type ? 20 : 5;
    }
}
//# sourceMappingURL=gifting_preference_engine.js.map