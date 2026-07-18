/**
 * [B1] 일기토 카드 덱 빌더 — DuelDeckBuilder
 *
 * 목적: 일기토 진입 시 무장의 무력, 성향, 보유 특기(일기토 관련)에 따라
 *       전투에 사용할 15장의 고유 행동 카드 덱을 동적 생성.
 *
 * 핵심 로직:
 *   1. 무력 십의 자리 수만큼 ATTACK 카드 비율 가중치 부여
 *   2. '무쌍' 특기 보유 시 CRITICAL 카드 2장 확정 추가
 *   3. Fisher-Yates 덱 셔플
 */
export type DuelCardType = 'ATTACK' | 'DEFENSE' | 'CRITICAL' | 'DODGE' | 'FOCUS';
export interface DuelCard {
    readonly type: DuelCardType;
    readonly damage: number;
    readonly spiritCost: number;
}
export interface DuelDeck {
    readonly cards: DuelCard[];
    readonly ownerId: string;
    readonly ownerMight: number;
}
export declare class DuelDeckBuilder {
    /**
     * 무장 정보를 기반으로 15장 카드 덱 생성
     *
     * @param officerId  - 무장 고유 ID
     * @param might      - 무력 (1~100)
     * @param skills     - 보유 특기 목록 (예: ['무쌍', '일기토', '무도'])
     * @returns DuelDeck — 15장 카드 + 소유자 정보
     */
    buildDeck(officerId: string, might: number, skills: string[]): DuelDeck;
    /** 덱에서 맨 위 카드 1장 뽑기 */
    drawCard(deck: DuelDeck): DuelCard | null;
    /** 덱 카드 수 반환 */
    remainingCount(deck: DuelDeck): number;
}
//# sourceMappingURL=duel_deck_builder.d.ts.map