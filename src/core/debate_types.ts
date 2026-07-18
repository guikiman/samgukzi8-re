export type DebateCardType = 'ATTACK' | 'DEFENSE' | 'FOCUS' | 'SPECIAL';

export interface DebateCard {
  id: string;
  name: string;
  type: DebateCardType;
  value: number; // 논리력/효과치
  cost: number;  // 정신력(Spirit) 소모
  description: string;
}

export interface DebaterState {
  officerId: string;
  name: string;
  maxSpirit: number; // 정신력 최대치
  spirit: number;    // 현재 정신력
  maxFocus: number;  // 기세(Focus) 최대치
  focus: number;     // 현재 기세
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
  pointsDealt: number; // 논리 포인트
  spiritChanged: { [officerId: string]: number };
  focusChanged: { [officerId: string]: number };
  log: string;
}
