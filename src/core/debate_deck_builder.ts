import { DebateCard, DebaterState } from './debate_types';

export class DebateDeckBuilder {
  private static readonly CARD_POOL: Record<string, Partial<DebateCard>> = {
    ARGUE: { name: '논파', type: 'ATTACK', cost: 0, description: '기본적인 논리 공격' },
    FALLACY: { name: '궤변', type: 'ATTACK', cost: 2, description: '상대를 혼란케 하는 강력한 궤변' },
    REFUTE: { name: '반론', type: 'DEFENSE', cost: 0, description: '상대의 논리를 반박하여 방어' },
    MEDITATE: { name: '성찰', type: 'FOCUS', cost: 0, description: '기세를 회복합니다' },
    TRUTH: { name: '진리', type: 'SPECIAL', cost: 5, description: '상대를 침묵시키는 결정적 논리' }
  };

  public static buildDeck(officerId: string, name: string, int: number, debateSkill: number): DebaterState {
    const deck: DebateCard[] = [];
    
    // 지력/정치 기반 덱 구성
    const attackCount = Math.floor(int / 20) + 3;
    
    for (let i = 0; i < attackCount; i++) {
      const isSpecial = i % 3 === 0 && int >= 70;
      deck.push(this.createCard(isSpecial ? 'FALLACY' : 'ARGUE', Math.floor(int * 0.1), `atk_${i}`));
    }

    const focusCount = 3 + Math.floor(debateSkill / 2);
    for (let i = 0; i < focusCount; i++) {
      deck.push(this.createCard('MEDITATE', 3, `foc_${i}`));
    }

    if (debateSkill >= 3) {
      deck.push(this.createCard('TRUTH', Math.floor(int * 0.4), 'special_truth'));
    }

    return {
      officerId,
      name,
      maxSpirit: 100 + (int),
      spirit: 100 + (int),
      maxFocus: 10,
      focus: 3,
      deck: this.shuffle(deck),
      hand: [],
      graveyard: [],
      activeBuffs: []
    };
  }

  private static createCard(poolKey: string, dynamicValue: number, uniqueId: string): DebateCard {
    const template = this.CARD_POOL[poolKey];
    return {
      id: `${poolKey.toLowerCase()}_${uniqueId}`,
      name: template.name!,
      type: template.type!,
      value: dynamicValue,
      cost: template.cost!,
      description: template.description!
    };
  }

  private static shuffle(array: DebateCard[]): DebateCard[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
