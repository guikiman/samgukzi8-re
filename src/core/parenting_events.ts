import type { ChildGenome } from "./child_genetics";

export interface ParentingEvent {
  readonly childId: string;
  readonly childName: string;
  readonly childAge: number;
  readonly type: "illness" | "rebellion" | "genius_awakening" | "accident" | "friendship" | "rivalry";
  readonly description: string;
  readonly statEffects: Partial<ChildGenome>;
}

export class ParentingEvents {
  generateEvent(childId: string, childName: string, age: number): ParentingEvent | null {
    const roll = Math.random();
    if (roll > 0.15) return null;

    const eventTypes: Array<() => ParentingEvent> = [
      () => this.generateIllness(childId, childName, age),
      () => this.generateRebellion(childId, childName, age),
      () => this.generateGeniusAwakening(childId, childName, age),
      () => this.generateAccident(childId, childName, age),
      () => this.generateFriendship(childId, childName, age),
      () => this.generateRivalry(childId, childName, age),
    ];

    return eventTypes[Math.floor(Math.random() * eventTypes.length)]();
  }

  private generateIllness(childId: string, childName: string, age: number): ParentingEvent {
    return {
      childId, childName, childAge: age, type: "illness",
      description: `${childName}이(가) 열병에 걸렸다. 모든 능력치가 일시적으로 감소한다.`,
      statEffects: { leadership: -5, might: -8, intelligence: -3, politics: -2, charisma: -3 },
    };
  }

  private generateRebellion(childId: string, childName: string, age: number): ParentingEvent {
    return {
      childId, childName, childAge: age, type: "rebellion",
      description: `${childName}이(가) 사춘기에 접어들어 반항하기 시작했다. 무력은 상승하나 카리스마가 하락한다.`,
      statEffects: { might: 5, charisma: -5 },
    };
  }

  private generateGeniusAwakening(childId: string, childName: string, age: number): ParentingEvent {
    return {
      childId, childName, childAge: age, type: "genius_awakening",
      description: `${childName}의 숨겨진 재능이 폭발했다! 모든 능력치가 크게 상승한다!`,
      statEffects: { leadership: 8, might: 5, intelligence: 10, politics: 6, charisma: 7 },
    };
  }

  private generateAccident(childId: string, childName: string, age: number): ParentingEvent {
    return {
      childId, childName, childAge: age, type: "accident",
      description: `${childName}이(가) 말에서 떨어져 다쳤다. 무력과 체력이 감소한다.`,
      statEffects: { might: -10, leadership: -3 },
    };
  }

  private generateFriendship(childId: string, childName: string, age: number): ParentingEvent {
    return {
      childId, childName, childAge: age, type: "friendship",
      description: `${childName}이(가) 또래 무장의 자녀와 친구가 되었다. 카리스마와 지력이 상승한다.`,
      statEffects: { charisma: 5, intelligence: 3 },
    };
  }

  private generateRivalry(childId: string, childName: string, age: number): ParentingEvent {
    return {
      childId, childName, childAge: age, type: "rivalry",
      description: `${childName}이(가) 경쟁자를 만났다! 무력과 지도력이 상승하나 인품이 하락한다.`,
      statEffects: { leadership: 5, might: 3, charisma: -3 },
    };
  }

  applyEffects(genome: ChildGenome, event: ParentingEvent): ChildGenome {
    const updated = { ...genome };
    const numericKeys: Array<keyof ChildGenome> = ["leadership", "might", "intelligence", "politics", "charisma"];
    for (const key of numericKeys) {
      const delta = event.statEffects[key];
      if (delta !== undefined) {
        const current = updated[key] as number;
        (updated as unknown as Record<string, number>)[key] = Math.max(1, Math.min(100, current + (delta as unknown as number)));
      }
    }
    return updated;
  }
}