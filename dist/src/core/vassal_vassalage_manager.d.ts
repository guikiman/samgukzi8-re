/**
 * [18] 종속국(조공국) 관리 — Vassal/Vassalage Manager
 *
 * 종속국이 지불하는 매달 조공 금 액수(30%) 연산 및
 * 배신 시 인질 무장을 처벌하는 정치 외교 조약 실행 모듈
 */
import type { FactionID, OfficerID } from './types.js';
export interface TributeResult {
    vassalId: FactionID;
    suzerainId: FactionID;
    tributeGold: number;
    tributeFood: number;
    month: number;
}
export interface VassalTreaty {
    suzerain: FactionID;
    vassal: FactionID;
    establishedMonth: number;
    hostageOfficerIds: OfficerID[];
    tributeRate: number;
    isActive: boolean;
}
export declare class VassalVassalageManager {
    private treaties;
    private monthlyTributeLog;
    /**
     * 종속 조약 체결
     */
    establishVassalage(suzerain: FactionID, vassal: FactionID, hostageOfficerIds: OfficerID[], month: number): VassalTreaty;
    /**
     * 매달 조공 처리 — 종속국 세입의 30%를 상국에 송금
     */
    processMonthlyTribute(vassalId: FactionID, vassalGold: number, vassalFood: number, month: number): TributeResult | null;
    /**
     * 종속국 배신 시 인질 처벌
     *
     * @returns 처벌된 인질 무장 ID 목록 (충성도 0, 포로 상태)
     */
    enforceVassalage(vassalId: FactionID): OfficerID[];
    /**
     * 종속국 해방
     */
    releaseVassal(vassalId: FactionID): boolean;
    /**
     * 인질 무장 추가
     */
    addHostage(vassalId: FactionID, officerId: OfficerID): boolean;
    /**
     * 조공 비율 변경 (0.0 ~ 0.5)
     */
    setTributeRate(vassalId: FactionID, rate: number): boolean;
    getActiveVassals(suzerainId: FactionID): VassalTreaty[];
    isVassal(factionId: FactionID): boolean;
    getTributeLog(): TributeResult[];
    getTreaty(vassalId: FactionID): VassalTreaty | null;
    reset(): void;
}
//# sourceMappingURL=vassal_vassalage_manager.d.ts.map