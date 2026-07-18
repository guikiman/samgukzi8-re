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
export declare class SocialCeremonyManager {
    private marriages;
    private swornBonds;
    private participantLog;
    getGift(giftId: string): Gift | undefined;
    getAllGifts(): Gift[];
    /** 선물 전달 */
    giveGift(senderId: OfficerID, receiverId: OfficerID, giftId: string): CeremonyResult;
    /** 연회 개최 */
    hostBanquet(hostId: OfficerID, guestIds: OfficerID[], goldSpent: number): CeremonyResult[];
    /** 의형제 제안 */
    proposeSwornBrother(officerId1: OfficerID, officerId2: OfficerID, affection: number): CeremonyResult;
    /** 결혼 제안 */
    proposeMarriage(officerId1: OfficerID, officerId2: OfficerID, affection: number): CeremonyResult;
    /** 방문 */
    visit(officerId1: OfficerID, officerId2: OfficerID): CeremonyResult;
    isSwornBrother(officerId1: OfficerID, officerId2: OfficerID): boolean;
    isMarried(officerId1: OfficerID, officerId2: OfficerID): boolean;
    clear(): void;
}
//# sourceMappingURL=social_ceremony_system.d.ts.map