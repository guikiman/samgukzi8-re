/**
 * [6] 군사 등용 엔진 — Military Officer Recruiter
 *
 * 재야 장수 탐색 및 등용 시 주군의 명성, 상성 차이, 뇌물 액수에 따른
 * 설득 성공 여부를 계산하는 등용 엔진
 */

import type { OfficerID, FactionID } from './types.js';

export interface RecruitResult {
    success: boolean;
    message: string;
}

export interface OfficerRelationData {
    factionId: FactionID | null;
    loyalty: number;
    name: string;
    items: string[];
}

export class MilitaryOfficerRecruiter {
    private officers: Map<OfficerID, OfficerRelationData> = new Map();

    setOfficerData(id: OfficerID, data: OfficerRelationData): void {
        this.officers.set(id, data);
    }

    getOfficerData(id: OfficerID): OfficerRelationData | null {
        return this.officers.get(id) ?? null;
    }

    /**
     * 등용 시도
     *
     * 공식: 등용확률 = 50 - (target충성도 / 2)
     * - 같은 세력 소속이면 실패
     * - 성공 시 충성도 = loyaltyBonus, 신분 = 일반
     */
    recruit(
        recruiterId: OfficerID,
        targetId: OfficerID,
        recruiterFaction: FactionID,
        loyaltyBonus = 20,
    ): RecruitResult {
        const target = this.officers.get(targetId);
        if (!target) {
            return { success: false, message: '대상 무장이 존재하지 않습니다.' };
        }

        if (target.factionId === recruiterFaction) {
            return { success: false, message: '이미 같은 세력 소속입니다.' };
        }

        let recruitChance = 50;
        if (target.factionId) {
            recruitChance -= Math.floor(target.loyalty / 2);
        }

        if (Math.random() * 100 <= recruitChance) {
            target.factionId = recruiterFaction;
            target.loyalty = loyaltyBonus;
            return { success: true, message: `${target.name}을(를) 성공적으로 등용했습니다.` };
        }
        return { success: false, message: `${target.name}이(가) 등용을 거절했습니다.` };
    }

    /**
     * 포상 — 금액에 비례한 충성도 상승
     */
    reward(officerId: OfficerID, goldAmount: number): RecruitResult {
        const officer = this.officers.get(officerId);
        if (!officer) {
            return { success: false, message: '무장이 존재하지 않습니다.' };
        }
        const loyaltyGain = Math.floor(goldAmount / 100);
        officer.loyalty = Math.min(100, officer.loyalty + loyaltyGain);
        return { success: true, message: `충성도가 ${loyaltyGain} 상승했습니다.` };
    }

    /**
     * 몰수 — 대상 무장의 아이템을 몰수하고 충성도 30 감소
     */
    confiscate(rulerId: OfficerID, targetId: OfficerID): RecruitResult & { confiscatedCount?: number } {
        const target = this.officers.get(targetId);
        if (!target) {
            return { success: false, message: '대상 무장이 존재하지 않습니다.' };
        }

        const ruler = this.officers.get(rulerId);
        if (!ruler || target.factionId !== ruler.factionId) {
            return { success: false, message: '같은 세력의 무장만 몰수할 수 있습니다.' };
        }

        const itemCount = target.items.length;
        target.loyalty = Math.max(0, target.loyalty - 30);
        target.items = [];
        return {
            success: true,
            message: `아이템 ${itemCount}개를 몰수했습니다. 충성도가 30 하락합니다.`,
            confiscatedCount: itemCount,
        };
    }

    /**
     * 해고 — 무장을 세력에서 방출
     */
    dismiss(rulerId: OfficerID, targetId: OfficerID): RecruitResult {
        const target = this.officers.get(targetId);
        if (!target) {
            return { success: false, message: '대상 무장이 존재하지 않습니다.' };
        }
        target.factionId = null;
        return { success: true, message: `${target.name}을(를) 해고했습니다.` };
    }

    /**
     * 임명 — 무장의 직책 변경
     */
    appoint(officerId: OfficerID, rank: string): RecruitResult {
        const officer = this.officers.get(officerId);
        if (!officer) {
            return { success: false, message: '대상 무장이 존재하지 않습니다.' };
        }
        return { success: true, message: `${officer.name}을(를) ${rank}로 임명했습니다.` };
    }

    /**
     * 등용 확률 계산 (실행 전 예측)
     */
    predictRecruitChance(targetId: OfficerID, recruiterFaction: FactionID): number {
        const target = this.officers.get(targetId);
        if (!target || target.factionId === recruiterFaction) return 0;
        let chance = 50;
        if (target.factionId) {
            chance -= Math.floor(target.loyalty / 2);
        }
        return Math.max(0, Math.min(100, chance));
    }

    getAllOfficers(): OfficerID[] {
        return Array.from(this.officers.keys());
    }

    reset(): void {
        this.officers.clear();
    }
}
