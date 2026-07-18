export type DuelCardType = 'ATTACK' | 'DEFENSE' | 'FOCUS' | 'SPECIAL';

export interface DuelCard {
  id: string;
  name: string;
  type: DuelCardType;
  value: number; // 카드의 기본 위력/효과치
  cost: number;  // 사용 시 소모되는 기합(Focus) 또는 코스트
  description: string;
}

export interface DuelistState {
  officerId: string;
  name: string;
  maxHp: number;
  hp: number;
  maxFocus: number; // 기합 최대치
  focus: number;    // 현재 기합
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
  focusChanged: { [officerId: string]: number };
  hpChanged: { [officerId: string]: number };
  log: string;
}
