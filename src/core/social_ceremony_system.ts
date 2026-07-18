/**
 * [C22][C26][C28] 의례 시스템 — 선물/연회/의형제/결혼식
 *
 * SocialCeremonyManager:
 *   - giveGift(): 선물 전달 (호감도 +아이템효과)
 *   - hostBanquet(): 연회 개최 (금 소모, 참석자 호감도 +10~20)
 *   - proposeSwornBrother(): 의형제 제안 (호감도 > 90 필요)
 *   - proposeMarriage(): 결혼 제안 (호감도 > 95 + 미혼)
 */

import type { OfficerID } from './types';

export type CeremonyType = 'GIFT' | 'BANQUET' | 'SWORN_BROTHER' | 'WEDDING' | 'VISIT';

export interface CeremonyResult {
    readonly ceremonyType: CeremonyType;
    readonly success: boolean;
    readonly affectionDelta: number;
    readonly message: string;
}

export interface Gift {
    readonly itemId: string;
    readonly itemName: string;
    readonly itemType: 'WEAPON' | 'MOUNT' | 'TREASURE' | 'BOOK' | 'CONSUMABLE';
    readonly affectionBonus: number;
    readonly goldValue: number;
}

const GIFT_DEFS: Record<string, Gift> = {
    rare_sword: { itemId: 'rare_sword', itemName: '명검', itemType: 'WEAPON', affectionBonus: 25, goldValue: 300 },
    fine_horse: { itemId: 'fine_horse', itemName: '명마', itemType: 'MOUNT', affectionBonus: 30, goldValue: 500 },
    gold_bars: { itemId: 'gold_bars', itemName: '금괴', itemType: 'TREASURE', affectionBonus: 20, goldValue: 200 },
    art_scroll: { itemId: 'art_scroll', itemName: '서화', itemType: 'TREASURE', affectionBonus: 15, goldValue: 150 },
    wine_set: { itemId: 'wine_set', itemName: '명주', itemType: 'CONSUMABLE', affectionBonus: 10, goldValue: 50 },
    silk: { itemId: 'silk', itemName: '비단', itemType: 'CONSUMABLE', affectionBonus: 12, goldValue: 80 },
    military_treatise: { itemId: 'military_treatise', itemName: '병법서', itemType: 'BOOK', affectionBonus: 22, goldValue: 250 },
};

export class SocialCeremonyManager {
    private marriages: Set<string> = new Set();
    private swornBonds: Set<string> = new Set();
    private participantLog: Map<string, number> = new Map();

    getGift(giftId: string): Gift | undefined {
        return GIFT_DEFS[giftId] ? { ...GIFT_DEFS[giftId] } : undefined;
    }

    getAllGifts(): Gift[] {
        return Object.values(GIFT_DEFS).map(g => ({ ...g }));
    }

    /** 선물 전달 */
    giveGift(senderId: OfficerID, receiverId: OfficerID, giftId: string): CeremonyResult {
        const gift = GIFT_DEFS[giftId];
        if (!gift) {
            return { ceremonyType: 'GIFT', success: false, affectionDelta: 0, message: '아이템이 존재하지 않습니다.' };
        }

        const affectionDelta = gift.affectionBonus;
        return {
            ceremonyType: 'GIFT', success: true, affectionDelta,
            message: `${senderId} → ${receiverId}: ${gift.itemName} 선물 (호감도 +${affectionDelta}).`,
        };
    }

    /** 연회 개최 */
    hostBanquet(hostId: OfficerID, guestIds: OfficerID[], goldSpent: number): CeremonyResult[] {
        const results: CeremonyResult[] = [];

        for (const guestId of guestIds) {
            const affectionDelta = Math.floor(Math.random() * 11) + 10; // 10~20
            const key = `${hostId}_${guestId}`;
            this.participantLog.set(key, (this.participantLog.get(key) ?? 0) + 1);

            results.push({
                ceremonyType: 'BANQUET', success: true, affectionDelta,
                message: `${guestId} 연회 참석 (호감도 +${affectionDelta}, 소모금: ${Math.floor(goldSpent / guestIds.length)}).`,
            });
        }

        return results;
    }

    /** 의형제 제안 */
    proposeSwornBrother(officerId1: OfficerID, officerId2: OfficerID, affection: number): CeremonyResult {
        const bondKey = [officerId1, officerId2].sort().join('_');

        if (this.swornBonds.has(bondKey)) {
            return { ceremonyType: 'SWORN_BROTHER', success: false, affectionDelta: 0, message: '이미 의형제 관계입니다.' };
        }

        if (affection < 90) {
            return { ceremonyType: 'SWORN_BROTHER', success: false, affectionDelta: 5, message: `호감도 부족 (${affection}/90).` };
        }

        this.swornBonds.add(bondKey);
        return { ceremonyType: 'SWORN_BROTHER', success: true, affectionDelta: 50, message: `${officerId1}와 ${officerId2}가 의형제를 맺었습니다!` };
    }

    /** 결혼 제안 */
    proposeMarriage(officerId1: OfficerID, officerId2: OfficerID, affection: number): CeremonyResult {
        const marriageKey = [officerId1, officerId2].sort().join('_');

        if (this.marriages.has(marriageKey)) {
            return { ceremonyType: 'WEDDING', success: false, affectionDelta: 0, message: '이미 결혼한 사이입니다.' };
        }

        if (affection < 95) {
            return { ceremonyType: 'WEDDING', success: false, affectionDelta: 5, message: `호감도 부족 (${affection}/95).` };
        }

        this.marriages.add(marriageKey);
        return { ceremonyType: 'WEDDING', success: true, affectionDelta: 80, message: `${officerId1}와 ${officerId2}가 결혼했습니다!` };
    }

    /** 방문 */
    visit(officerId1: OfficerID, officerId2: OfficerID): CeremonyResult {
        return {
            ceremonyType: 'VISIT', success: true, affectionDelta: 3,
            message: `${officerId1}가 ${officerId2}를 방문했습니다. (호감도 +3)`,
        };
    }

    isSwornBrother(officerId1: OfficerID, officerId2: OfficerID): boolean {
        return this.swornBonds.has([officerId1, officerId2].sort().join('_'));
    }

    isMarried(officerId1: OfficerID, officerId2: OfficerID): boolean {
        return this.marriages.has([officerId1, officerId2].sort().join('_'));
    }

    clear(): void {
        this.marriages.clear();
        this.swornBonds.clear();
        this.participantLog.clear();
    }
}
