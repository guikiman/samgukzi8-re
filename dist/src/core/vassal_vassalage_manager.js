/**
 * [18] 종속국(조공국) 관리 — Vassal/Vassalage Manager
 *
 * 종속국이 지불하는 매달 조공 금 액수(30%) 연산 및
 * 배신 시 인질 무장을 처벌하는 정치 외교 조약 실행 모듈
 */
export class VassalVassalageManager {
    constructor() {
        this.treaties = new Map(); // vassal → treaty
        this.monthlyTributeLog = [];
    }
    /**
     * 종속 조약 체결
     */
    establishVassalage(suzerain, vassal, hostageOfficerIds, month) {
        const treaty = {
            suzerain,
            vassal,
            establishedMonth: month,
            hostageOfficerIds: [...hostageOfficerIds],
            tributeRate: 0.3,
            isActive: true,
        };
        this.treaties.set(vassal, treaty);
        return treaty;
    }
    /**
     * 매달 조공 처리 — 종속국 세입의 30%를 상국에 송금
     */
    processMonthlyTribute(vassalId, vassalGold, vassalFood, month) {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive)
            return null;
        const tributeGold = Math.floor(vassalGold * treaty.tributeRate);
        const tributeFood = Math.floor(vassalFood * treaty.tributeRate);
        const result = {
            vassalId,
            suzerainId: treaty.suzerain,
            tributeGold,
            tributeFood,
            month,
        };
        this.monthlyTributeLog.push(result);
        return result;
    }
    /**
     * 종속국 배신 시 인질 처벌
     *
     * @returns 처벌된 인질 무장 ID 목록 (충성도 0, 포로 상태)
     */
    enforceVassalage(vassalId) {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive)
            return [];
        treaty.isActive = false;
        return treaty.hostageOfficerIds;
    }
    /**
     * 종속국 해방
     */
    releaseVassal(vassalId) {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive)
            return false;
        treaty.isActive = false;
        return true;
    }
    /**
     * 인질 무장 추가
     */
    addHostage(vassalId, officerId) {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive)
            return false;
        treaty.hostageOfficerIds.push(officerId);
        return true;
    }
    /**
     * 조공 비율 변경 (0.0 ~ 0.5)
     */
    setTributeRate(vassalId, rate) {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive)
            return false;
        treaty.tributeRate = Math.max(0, Math.min(0.5, rate));
        return true;
    }
    getActiveVassals(suzerainId) {
        return Array.from(this.treaties.values())
            .filter(t => t.suzerain === suzerainId && t.isActive);
    }
    isVassal(factionId) {
        return this.treaties.has(factionId) && this.treaties.get(factionId).isActive;
    }
    getTributeLog() {
        return this.monthlyTributeLog.slice();
    }
    getTreaty(vassalId) {
        return this.treaties.get(vassalId) ?? null;
    }
    reset() {
        this.treaties.clear();
        this.monthlyTributeLog = [];
    }
}
//# sourceMappingURL=vassal_vassalage_manager.js.map