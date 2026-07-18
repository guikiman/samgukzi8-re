import type { Personality } from "./types";

export interface ChildGenome {
  leadership: number;
  might: number;
  intelligence: number;
  politics: number;
  charisma: number;
  personality: Personality;
  gender: "M" | "F";
}

export class ChildGenetics {
  private readonly MUTATION_RATE = 0.05;
  private readonly MUTATION_RANGE = 10;

  generateChildGenome(
    fatherStats: { leadership: number; might: number; intelligence: number; politics: number; charisma: number },
    motherStats: { leadership: number; might: number; intelligence: number; politics: number; charisma: number },
    fatherPersonality: Personality,
    motherPersonality: Personality,
  ): ChildGenome {
    const baseLeadership = this.inheritTrait(fatherStats.leadership, motherStats.leadership);
    const baseMight = this.inheritTrait(fatherStats.might, motherStats.might);
    const baseIntelligence = this.inheritTrait(fatherStats.intelligence, motherStats.intelligence);
    const basePolitics = this.inheritTrait(fatherStats.politics, motherStats.politics);
    const baseCharisma = this.inheritTrait(fatherStats.charisma, motherStats.charisma);

    return {
      leadership: this.mutate(baseLeadership),
      might: this.mutate(baseMight),
      intelligence: this.mutate(baseIntelligence),
      politics: this.mutate(basePolitics),
      charisma: this.mutate(baseCharisma),
      personality: this.inheritPersonality(fatherPersonality, motherPersonality),
      gender: Math.random() < 0.5 ? "M" : "F",
    };
  }

  private inheritTrait(fatherValue: number, motherValue: number): number {
    const mid = (fatherValue + motherValue) / 2;
    const variance = Math.abs(fatherValue - motherValue) / 4;
    return Math.round(mid + (Math.random() - 0.5) * variance * 2);
  }

  private mutate(value: number): number {
    if (Math.random() < this.MUTATION_RATE) {
      const delta = Math.floor((Math.random() - 0.5) * 2 * this.MUTATION_RANGE);
      return Math.max(1, Math.min(100, value + delta));
    }
    return Math.max(1, Math.min(100, value));
  }

  private inheritPersonality(father: Personality, mother: Personality): Personality {
    const roll = Math.random();
    if (roll < 0.4) return father;
    if (roll < 0.8) return mother;
    const allPersonalities: Personality[] = [
      "AGGRESSIVE", "CALM", "CAUTIOUS", "TIMID",
      "LOYAL", "AMBITIOUS", "RIGHTEOUS", "GREEDY",
    ];
    return allPersonalities[Math.floor(Math.random() * allPersonalities.length)];
  }

  calculateTalent(genome: ChildGenome): "genius" | "gifted" | "average" | "slow" {
    const avg = (genome.leadership + genome.might + genome.intelligence + genome.politics + genome.charisma) / 5;
    if (avg >= 85) return "genius";
    if (avg >= 70) return "gifted";
    if (avg >= 40) return "average";
    return "slow";
  }
}