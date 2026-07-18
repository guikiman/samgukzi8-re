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

const BASE_CARD_DAMAGE: Record<DuelCardType, number> = {
    ATTACK: 15,
    DEFENSE: 0,
    CRITICAL: 35,
    DODGE: 0,
    FOCUS: 0,
};

const BASE_CARD_COST: Record<DuelCardType, number> = {
    ATTACK: 0,
    DEFENSE: 0,
    CRITICAL: 2,
    DODGE: 0,
    FOCUS: 1,
};

/**
 * Fisher-Yates (Knuth) 셔플 — O(n) 균일 랜덤 순열
 */
function shuffle<T>(array: T[]): T[] {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export class DuelDeckBuilder {
    /**
     * 무장 정보를 기반으로 15장 카드 덱 생성
     *
     * @param officerId  - 무장 고유 ID
     * @param might      - 무력 (1~100)
     * @param skills     - 보유 특기 목록 (예: ['무쌍', '일기토', '무도'])
     * @returns DuelDeck — 15장 카드 + 소유자 정보
     */
    buildDeck(officerId: string, might: number, skills: string[]): DuelDeck {
        const cards: DuelCard[] = [];

        // 1. 무력 십의 자리 수 계산 → ATTACK 비율 가중치
        //    예: 무력 95 → 9, 무력 87 → 8, 무력 72 → 7
        const mightTensDigit = Math.floor(might / 10);             // 0~10
        const attackWeight = Math.min(0.6, 0.2 + mightTensDigit * 0.04); // 0.2~0.6

        // 2. '무쌍' 특기 보유 시 CRITICAL 2장 확정 추가
        const hasMusou = skills.some(s => s === '무쌍' || s === 'MUSOU' || s === 'MIGHTY');

        // 기본 분포 가중치 계산
        const distribution: { type: DuelCardType; weight: number; guaranteed?: number }[] = [
            { type: 'ATTACK',  weight: attackWeight },
            { type: 'DEFENSE', weight: 0.20 },
            { type: 'CRITICAL', weight: hasMusou ? 0.08 : 0.05 },
            { type: 'DODGE',   weight: 0.15 },
            { type: 'FOCUS',   weight: 0.15 },
        ];

        // 가중치 정규화
        const totalWeight = distribution.reduce((s, d) => s + d.weight, 0);

        // 15장 카드 생성
        for (let i = 0; i < 15; i++) {
            let roll = Math.random() * totalWeight;
            let selected: DuelCardType = 'ATTACK';
            for (const dist of distribution) {
                roll -= dist.weight;
                if (roll <= 0) {
                    selected = dist.type;
                    break;
                }
            }
            cards.push({
                type: selected,
                damage: BASE_CARD_DAMAGE[selected],
                spiritCost: BASE_CARD_COST[selected],
            });
        }

        // 3. '무쌍' 특기: CRITICAL 2장 확정 추가 (덱 마지막 2장을 CRITICAL로 교체)
        if (hasMusou) {
            cards[13] = { type: 'CRITICAL', damage: BASE_CARD_DAMAGE.CRITICAL, spiritCost: BASE_CARD_COST.CRITICAL };
            cards[14] = { type: 'CRITICAL', damage: BASE_CARD_DAMAGE.CRITICAL, spiritCost: BASE_CARD_COST.CRITICAL };
        }

        // 4. Fisher-Yates 셔플
        return {
            cards: shuffle(cards),
            ownerId: officerId,
            ownerMight: might,
        };
    }

    /** 덱에서 맨 위 카드 1장 뽑기 */
    drawCard(deck: DuelDeck): DuelCard | null {
        if (deck.cards.length === 0) return null;
        const [top, ...rest] = deck.cards;
        deck.cards.length = 0;
        deck.cards.push(...rest);
        return top;
    }

    /** 덱 카드 수 반환 */
    remainingCount(deck: DuelDeck): number {
        return deck.cards.length;
    }
}
