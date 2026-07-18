export type DuelCardType = 'ATTACK' | 'DEFENSE' | 'FOCUS' | 'SPECIAL';
export interface DuelCard {
    id: string;
    name: string;
    type: DuelCardType;
    value: number;
    cost: number;
    description: string;
}
export interface DuelistState {
    officerId: string;
    name: string;
    maxHp: number;
    hp: number;
    maxFocus: number;
    focus: number;
    deck: DuelCard[];
    hand: DuelCard[];
    graveyard: DuelCard[];
    activeBuffs: string[];
}
export interface DuelRoundResult {
    round: number;
    attackerId: string;
    defenderId: string;
    attackCard: DuelCard;
    defenseCard: DuelCard | null;
    damageDealt: number;
    focusChanged: {
        [officerId: string]: number;
    };
    hpChanged: {
        [officerId: string]: number;
    };
    log: string;
}
//# sourceMappingURL=duel_types.d.ts.map