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
    tributeRate: number; // 0.0 ~ 1.0, 기본 0.3
    isActive: boolean;
}

export class VassalVassalageManager {
    private treaties: Map<FactionID, VassalTreaty> = new Map(); // vassal → treaty
    private monthlyTributeLog: TributeResult[] = [];

    /**
     * 종속 조약 체결
     */
    establishVassalage(
        suzerain: FactionID,
        vassal: FactionID,
        hostageOfficerIds: OfficerID[],
        month: number,
    ): VassalTreaty {
        const treaty: VassalTreaty = {
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
    processMonthlyTribute(
        vassalId: FactionID,
        vassalGold: number,
        vassalFood: number,
        month: number,
    ): TributeResult | null {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive) return null;

        const tributeGold = Math.floor(vassalGold * treaty.tributeRate);
        const tributeFood = Math.floor(vassalFood * treaty.tributeRate);

        const result: TributeResult = {
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
    enforceVassalage(vassalId: FactionID): OfficerID[] {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive) return [];

        treaty.isActive = false;
        return treaty.hostageOfficerIds;
    }

    /**
     * 종속국 해방
     */
    releaseVassal(vassalId: FactionID): boolean {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive) return false;
        treaty.isActive = false;
        return true;
    }

    /**
     * 인질 무장 추가
     */
    addHostage(vassalId: FactionID, officerId: OfficerID): boolean {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive) return false;
        treaty.hostageOfficerIds.push(officerId);
        return true;
    }

    /**
     * 조공 비율 변경 (0.0 ~ 0.5)
     */
    setTributeRate(vassalId: FactionID, rate: number): boolean {
        const treaty = this.treaties.get(vassalId);
        if (!treaty || !treaty.isActive) return false;
        treaty.tributeRate = Math.max(0, Math.min(0.5, rate));
        return true;
    }

    getActiveVassals(suzerainId: FactionID): VassalTreaty[] {
        return Array.from(this.treaties.values())
            .filter(t => t.suzerain === suzerainId && t.isActive);
    }

    isVassal(factionId: FactionID): boolean {
        return this.treaties.has(factionId) && this.treaties.get(factionId)!.isActive;
    }

    getTributeLog(): TributeResult[] {
        return this.monthlyTributeLog.slice();
    }

    getTreaty(vassalId: FactionID): VassalTreaty | null {
        return this.treaties.get(vassalId) ?? null;
    }

    reset(): void {
        this.treaties.clear();
        this.monthlyTributeLog = [];
    }
}
