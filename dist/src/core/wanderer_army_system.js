/**
 * [A8] 방랑군 결성 및 거병 시스템 — Wanderer Army System
 *
 * WandererArmyManager:
 *   - formWandererArmy(): 무소속 무장이 방랑군 결성
 *   - disband(): 방랑군 해산
 *   - moveTo(): 도시로 이동
 *   - uprise(): 거병 (도시 장악 시도)
 *   - 거병 성공 확률 = (병사수/도시방어군) × (통솔/100) × (1 - 충성도/100)
 */
export class WandererArmyManager {
    constructor() {
        this.state = null;
    }
    /**
     * 방랑군 결성
     * @param leaderId - 지휘관 무장 ID
     * @param gold - 보유 금
     * @param soldiers - 모집 병사 수
     */
    formWandererArmy(leaderId, gold, soldiers) {
        this.state = {
            wandererId: `wanderer_${leaderId}_${Date.now()}`,
            leaderId,
            officerIds: [leaderId],
            gold: Math.max(0, gold),
            food: Math.max(0, Math.floor(gold * 0.5)),
            soldiers: Math.max(1, Math.min(soldiers, 5000)),
            baseCamp: null,
            location: null,
            formationDate: Date.now(),
            morale: 50,
            isActive: true,
        };
        return this.state;
    }
    /** 방랑군 해산 */
    disband() {
        if (!this.state?.isActive)
            return false;
        this.state = { ...this.state, isActive: false, soldiers: 0, officerIds: [this.state.leaderId] };
        return true;
    }
    /** 도시로 이동 */
    moveTo(cityId) {
        if (!this.state?.isActive)
            return false;
        this.state = { ...this.state, location: cityId };
        return true;
    }
    /** 방랑군에 무장 추가 */
    addOfficer(officerId) {
        if (!this.state?.isActive)
            return false;
        if (this.state.officerIds.includes(officerId))
            return false;
        this.state = { ...this.state, officerIds: [...this.state.officerIds, officerId] };
        return true;
    }
    /**
     * 거병 (도시 장악 시도)
     * @param targetCityId - 공격 대상 도시
     * @param cityDefenseForce - 도시 방어군 수
     * @param cityLoyalty - 도시 충성도 (0~100)
     * @param leaderLeadership - 지휘관 통솔력 (0~100)
     */
    uprise(targetCityId, cityDefenseForce, cityLoyalty, leaderLeadership) {
        if (!this.state?.isActive) {
            return { success: false, capturedCityId: null, newFactionId: null, survivors: 0, message: '방랑군이 존재하지 않습니다.' };
        }
        const soldiers = this.state.soldiers;
        if (soldiers <= 0) {
            return { success: false, capturedCityId: null, newFactionId: null, survivors: 0, message: '병사가 없어 거병할 수 없습니다.' };
        }
        // 거병 성공 확률 계산
        const forceRatio = soldiers / Math.max(1, cityDefenseForce);
        const leadershipFactor = leaderLeadership / 100;
        const loyaltyFactor = 1 - cityLoyalty / 100;
        const successProbability = forceRatio * leadershipFactor * loyaltyFactor;
        // 확률에 따른 성공 판정
        const roll = Math.random();
        const success = roll < successProbability;
        if (success) {
            const newFactionId = `faction_wanderer_${this.state.leaderId}`;
            this.state = {
                ...this.state,
                location: targetCityId,
                isActive: false,
                soldiers: Math.floor(soldiers * 0.8),
            };
            return {
                success: true,
                capturedCityId: targetCityId,
                newFactionId,
                survivors: Math.floor(soldiers * 0.8),
                message: `거병 성공! ${targetCityId}를 장악했습니다.`,
            };
        }
        else {
            // 실패 시 방랑군 해산
            const survivors = Math.floor(soldiers * 0.3);
            this.state = { ...this.state, isActive: false, soldiers: 0 };
            return {
                success: false,
                capturedCityId: null,
                newFactionId: null,
                survivors,
                message: `거병 실패. 방랑군이 해산되었습니다.`,
            };
        }
    }
    getState() {
        return this.state ? { ...this.state } : null;
    }
    /** 방랑군 상태 초기화 (테스트용) */
    reset() {
        this.state = null;
    }
}
//# sourceMappingURL=wanderer_army_system.js.map