/**
 * [A9] 반란 및 쿠데타 이벤트 트리거 — Rebellion & Coup System
 *
 * RebellionManager:
 *   - attemptCoup(): 태수/도독의 쿠데타 시도
 *   - triggerRevolt(): 세력 내 반란
 *   - defectToFaction(): 타 세력으로 투항
 *   - 쿠데타 성공 = 충성도 < 30 + 통솔 > 70 + 도시병력 > 세력총병력×0.3
 */
export class RebellionManager {
    constructor() {
        this.triggers = [];
    }
    getTriggers() {
        return [...this.triggers];
    }
    /**
     * 쿠데타 시도
     * @param officerId - 쿠데타 주도 무장
     * @param cityId - 대상 도시
     * @param cityTroops - 도시 병력
     * @param factionTotalTroops - 세력 총 병력
     * @param loyalty - 무장의 충성도 (0~100)
     * @param leadership - 무장의 통솔력 (0~100)
     */
    attemptCoup(officerId, cityId, cityTroops, factionTotalTroops, loyalty, leadership) {
        this.triggers.push({
            rebelOfficerId: officerId,
            targetCityId: cityId,
            targetFactionId: '',
            triggerType: 'COUP',
            timestamp: Date.now(),
        });
        // 쿠데타 성공 조건
        const lowLoyalty = loyalty < 30;
        const highLeadership = leadership > 70;
        const sufficientTroops = cityTroops > factionTotalTroops * 0.3;
        if (lowLoyalty && highLeadership && sufficientTroops) {
            const newFactionId = `faction_coup_${officerId}_${Date.now()}`;
            return {
                success: true,
                capturedCityIds: [cityId],
                defectedOfficerIds: [officerId],
                newFactionId,
                message: `쿠데타 성공! ${cityId}를 장악하고 신세력을 수립했습니다.`,
            };
        }
        // 실패 원인 분석
        const reasons = [];
        if (!lowLoyalty)
            reasons.push('충성도가 너무 높음');
        if (!highLeadership)
            reasons.push('통솔력 부족');
        if (!sufficientTroops)
            reasons.push('병력 부족');
        return {
            success: false,
            capturedCityIds: [],
            defectedOfficerIds: [],
            newFactionId: null,
            message: `쿠데타 실패: ${reasons.join(', ')}`,
        };
    }
    /**
     * 세력 내 반란 발생
     * @param officerId - 반란 주도 무장
     * @param factionId - 대상 세력
     * @param cityId - 반란 발생 도시
     * @param garrisonLoyalty - 수비대 충성도 (0~100)
     * @param publicOrder - 도시 치안 (0~100)
     */
    triggerRevolt(officerId, factionId, cityId, garrisonLoyalty, publicOrder) {
        this.triggers.push({
            rebelOfficerId: officerId,
            targetCityId: cityId,
            targetFactionId: factionId,
            triggerType: 'REVOLT',
            timestamp: Date.now(),
        });
        // 반란 성공 조건
        const lowOrder = publicOrder < 30;
        const lowGarrisonLoyalty = garrisonLoyalty < 40;
        const success = lowOrder && lowGarrisonLoyalty;
        if (success) {
            const destroyedFacilities = Math.floor(Math.random() * 3) + 1;
            const lostSoldiers = Math.floor(Math.random() * 2000) + 500;
            return {
                success: true,
                damagedCityId: cityId,
                destroyedFacilities,
                lostSoldiers,
                message: `반란 발생! ${cityId}에서 시설 ${destroyedFacilities}개 파괴, 병사 ${lostSoldiers}명 손실.`,
            };
        }
        return {
            success: false,
            damagedCityId: null,
            destroyedFacilities: 0,
            lostSoldiers: 0,
            message: '반란 진압 성공.',
        };
    }
    /**
     * 타 세력으로 투항
     * @param officerId - 투항 무장
     * @param currentFactionId - 현재 세력
     * @param targetFactionId - 대상 세력
     * @param loyalty - 현재 충성도
     */
    defectToFaction(officerId, currentFactionId, targetFactionId, loyalty) {
        this.triggers.push({
            rebelOfficerId: officerId,
            targetCityId: '',
            targetFactionId: currentFactionId,
            triggerType: 'DEFECT',
            timestamp: Date.now(),
        });
        // 충성도가 20 미만이면 자동 투항
        const success = loyalty < 20;
        return {
            success,
            targetFactionId,
            message: success
                ? `${officerId}가 ${targetFactionId}로 투항했습니다.`
                : `${officerId}는 투항을 거부했습니다.`,
        };
    }
    clearTriggers() {
        this.triggers = [];
    }
}
//# sourceMappingURL=rebellion_coup_system.js.map