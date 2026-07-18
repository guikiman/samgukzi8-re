export type DebateCardType = 'ATTACK' | 'DEFENSE' | 'FOCUS' | 'SPECIAL';
export interface DebateCard {
    id: string;
    name: string;
    type: DebateCardType;
    value: number;
    cost: number;
    description: string;
}
export interface DebaterState {
    officerId: string;
    name: string;
    maxSpirit: number;
    spirit: number;
    maxFocus: number;
    focus: number;
    deck: DebateCard[];
    hand: DebateCard[];
    graveyard: DebateCard[];
    activeBuffs: string[];
}
export interface DebateRoundResult {
    round: number;
    attackerId: string;
    defenderId: string;
    attackCard: DebateCard;
    defenseCard: DebateCard | null;
    pointsDealt: number;
    spiritChanged: {
        [officerId: string]: number;
    };
    focusChanged: {
        [officerId: string]: number;
    };
    log: string;
}
//# sourceMappingURL=debate_types.d.ts.map