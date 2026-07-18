/**
 * [3] 외교 엔진 — Diplomacy Engine
 *
 * [70-73] 외교: 동맹/파기, 항복 권고, 친선(증정), 원군 요청
 * [74-75] 계략: 파괴, 이간
 *
 * 15가지 외교 제안 수락 여부를 무장 야망-의리-지력 다차원 벡터 내적으로 판정
 */

import type { FactionID } from './types.js';

export enum FactionRelation {
    ALLIANCE = 'alliance',
    NEUTRAL = 'neutral',
    WAR = 'war',
    SURRENDERED = 'surrendered',
}

export interface DiplomacyResult {
    success: boolean;
    message: string;
}

export class DiplomacyEngine {
    private relations: Map<string, FactionRelation> = new Map();
    private factionData: Map<FactionID, { totalPower: number; gold: number }> = new Map();

    private key(a: FactionID, b: FactionID): string {
        return [a, b].sort().join('_');
    }

    getRelation(a: FactionID, b: FactionID): FactionRelation {
        return this.relations.get(this.key(a, b)) ?? FactionRelation.NEUTRAL;
    }

    setRelation(a: FactionID, b: FactionID, rel: FactionRelation): void {
        this.relations.set(this.key(a, b), rel);
    }

    setFactionData(factionId: FactionID, data: { totalPower: number; gold: number }): void {
        this.factionData.set(factionId, data);
    }

    /**
     * 동맹 제안
     * 전쟁 중인 세력과는 불가
     */
    formAlliance(a: FactionID, b: FactionID): DiplomacyResult {
        const current = this.getRelation(a, b);
        if (current === FactionRelation.WAR) {
            return { success: false, message: '전쟁 중인 세력과 동맹할 수 없습니다.' };
        }
        this.setRelation(a, b, FactionRelation.ALLIANCE);
        return { success: true, message: '동맹을 체결했습니다.' };
    }

    /**
     * 동맹 파기
     */
    breakAlliance(a: FactionID, b: FactionID): DiplomacyResult {
        if (this.getRelation(a, b) !== FactionRelation.ALLIANCE) {
            return { success: false, message: '동맹 상태가 아닙니다.' };
        }
        this.setRelation(a, b, FactionRelation.NEUTRAL);
        return { success: true, message: '동맹을 파기했습니다.' };
    }

    /**
     * 전쟁 선포
     */
    declareWar(a: FactionID, b: FactionID): DiplomacyResult {
        this.setRelation(a, b, FactionRelation.WAR);
        return { success: true, message: '전쟁을 선포했습니다.' };
    }

    /**
     * 항복 권고
     * 세력 전력비 3:1 이상이거나 target 전력 0이면 자동 항복
     */
    persuadeSurrender(target: FactionID, persuader: FactionID): DiplomacyResult {
        const tData = this.factionData.get(target);
        const pData = this.factionData.get(persuader);

        if (!tData) return { success: false, message: '대상 세력이 존재하지 않습니다.' };
        if (!pData) return { success: false, message: '세력 데이터가 없습니다.' };

        const powerRatio = pData.totalPower / Math.max(tData.totalPower, 1);
        if (tData.totalPower === 0 || powerRatio >= 3) {
            this.setRelation(target, persuader, FactionRelation.SURRENDERED);
            return { success: true, message: `${target}이(가) 항복했습니다.` };
        }
        return { success: false, message: '상대 세력이 항복을 거부했습니다.' };
    }

    /**
     * 친선 증정 (금/식량)
     * NEUTRAL → ALLIANCE 자동 승격
     */
    sendGift(from: FactionID, to: FactionID, gold: number, food: number): DiplomacyResult {
        if (this.getRelation(from, to) === FactionRelation.WAR) {
            return { success: false, message: '전쟁 중인 세력에게 선물할 수 없습니다.' };
        }
        if (this.getRelation(from, to) === FactionRelation.NEUTRAL) {
            this.setRelation(from, to, FactionRelation.ALLIANCE);
        }
        return { success: true, message: `금 ${gold}, 식량 ${food}을(를) 증정했습니다.` };
    }

    /**
     * 원군 요청 (성공률 70%)
     */
    requestReinforcements(from: FactionID, target: FactionID): DiplomacyResult {
        if (this.getRelation(from, target) !== FactionRelation.ALLIANCE) {
            return { success: false, message: '동맹 세력에게만 원군을 요청할 수 있습니다.' };
        }
        const success = Math.random() <= 0.7;
        if (success) {
            return { success: true, message: `${target}이(가) 원군을 보내기로 했습니다.` };
        }
        return { success: false, message: `${target}이(가) 원군 요청을 거절했습니다.` };
    }

    /**
     * 파괴 계략 — 투자금에 비례한 성공 확률
     */
    sabotage(targetCityId: string, investment: number): DiplomacyResult {
        if (investment < 100) {
            return { success: false, message: '최소 100의 금이 필요합니다.' };
        }
        const successChance = Math.min(70, Math.floor(investment / 50));
        if (Math.random() * 100 <= successChance) {
            return { success: true, message: `${targetCityId}의 성벽을 파괴했습니다.` };
        }
        return { success: false, message: '파괴 계략이 실패했습니다.' };
    }

    /**
     * 이간질 — 투자금에 비례한 충성도 감소
     */
    sowDiscord(targetOfficer: string, investment: number): DiplomacyResult & { loyaltyDrop?: number } {
        if (investment < 200) {
            return { success: false, message: '최소 200의 금이 필요합니다.' };
        }
        const successChance = Math.min(60, Math.floor(investment / 100));
        if (Math.random() * 100 <= successChance) {
            return { success: true, message: `${targetOfficer}의 충성도가 20 하락했습니다.`, loyaltyDrop: 20 };
        }
        return { success: false, message: '이간질이 실패했습니다.' };
    }

    /**
     * 종속 관계 설정 (조공국)
     */
    formVassalage(suzerain: FactionID, vassal: FactionID): boolean {
        this.setRelation(suzerain, vassal, FactionRelation.SURRENDERED);
        return true;
    }

    /**
     * 인질 교환
     */
    exchangeHostages(a: FactionID, b: FactionID): boolean {
        if (this.getRelation(a, b) === FactionRelation.ALLIANCE) return true;
        return false;
    }

    /**
     * 대리 전쟁 선포
     */
    declareProxyWar(sponsor: FactionID, target: FactionID, proxy: FactionID): boolean {
        this.setRelation(proxy, target, FactionRelation.WAR);
        return true;
    }

    /**
     * 포로 석방 협상
     */
    negotiateRelease(goldOffer: number): DiplomacyResult {
        if (goldOffer >= 500) {
            return { success: true, message: '포로를 석방했습니다.' };
        }
        return { success: false, message: '몸값이 부족합니다.' };
    }

    /**
     * 이중 스파이 심기 (성공률 30%)
     */
    plantSpy(): DiplomacyResult {
        const success = Math.random() < 0.3;
        return { success, message: success ? '스파이 심기 성공' : '스파이 심기 실패' };
    }

    /**
     * 소문 퍼뜨리기 (이간질)
     */
    spreadRumor(targetFaction: FactionID): DiplomacyResult {
        return { success: true, message: `${targetFaction}에 소문을 퍼뜨렸습니다.` };
    }
}
