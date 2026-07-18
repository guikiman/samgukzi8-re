import type { Personality } from "./types";

export interface Rumor {
  readonly id: string;
  readonly targetId: string;
  readonly text: string;
  readonly severity: "minor" | "major" | "scandal";
  readonly spreadRadius: number;
  readonly createdAt: number;
  readonly lifetime: number;
}

export interface CityReputation {
  readonly cityId: string;
  fame: number;
  infamy: number;
  activeRumors: string[];
}

export class ReputationRumorSystem {
  private rumors = new Map<string, Rumor>();
  private cityReputations = new Map<string, CityReputation>();
  private officerReputations = new Map<string, { fame: number; infamy: number }>();

  setOfficerReputation(officerId: string, fame: number, infamy: number): void {
    this.officerReputations.set(officerId, { fame, infamy });
  }

  getOfficerReputation(officerId: string): { fame: number; infamy: number } {
    return this.officerReputations.get(officerId) ?? { fame: 50, infamy: 0 };
  }

  setCityReputation(cityId: string, fame: number, infamy: number): void {
    this.cityReputations.set(cityId, { cityId, fame, infamy, activeRumors: [] });
  }

  getCityReputation(cityId: string): CityReputation {
    return this.cityReputations.get(cityId) ?? { cityId, fame: 50, infamy: 0, activeRumors: [] };
  }

  generateRumor(targetId: string, severity: Rumor["severity"], personality?: Personality): Rumor {
    const texts: Record<string, string[]> = {
      minor: [
        `${targetId}가 시장에서 싸움을 벌였다.`,
        `${targetId}가 밤늦게까지 술을 마셨다.`,
        `${targetId}의 수행원이 횡포를 부렸다.`,
      ],
      major: [
        `${targetId}가 세력을 배신할 계획을 세우고 있다.`,
        `${targetId}가 군자금을 횡령했다.`,
        `${targetId}가 적국과 내통하고 있다.`,
      ],
      scandal: [
        `${targetId}가 주군의 후궁을 탐했다.`,
        `${targetId}가 동료 무장을 살해했다.`,
        `${targetId}가 황제의 자리를 노리고 있다.`,
      ],
    };

    const pool = texts[severity] ?? texts.minor;
    const text = pool[Math.floor(Math.random() * pool.length)];
    const lifetime = { minor: 3, major: 6, scandal: 12 }[severity];
    const spreadRadius = { minor: 1, major: 2, scandal: 3 }[severity];

    const rumor: Rumor = {
      id: `rumor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      targetId,
      text,
      severity,
      spreadRadius,
      createdAt: Date.now(),
      lifetime,
    };
    this.rumors.set(rumor.id, rumor);
    return rumor;
  }

  propagateRumor(rumorId: string, adjacentCityIds: string[]): string[] {
    const rumor = this.rumors.get(rumorId);
    if (!rumor) return [];

    const affected: string[] = [];
    for (const cityId of adjacentCityIds.slice(0, rumor.spreadRadius)) {
      const rep = this.getCityReputation(cityId);
      rep.activeRumors.push(rumorId);
      rep.infamy += rumor.severity === "scandal" ? 15 : rumor.severity === "major" ? 8 : 3;
      this.cityReputations.set(cityId, rep);
      affected.push(cityId);
    }
    return affected;
  }

  applyPersonalityRumorBonus(personality: Personality): number {
    const multipliers: Record<string, number> = {
      AGGRESSIVE: 1.3,
      AMBITIOUS: 1.5,
      GREEDY: 1.4,
      RIGHTEOUS: 0.6,
      LOYAL: 0.5,
      CALM: 0.7,
      CAUTIOUS: 0.8,
      TIMID: 0.9,
    };
    return multipliers[personality] ?? 1.0;
  }

  cleanExpiredRumors(): number {
    let cleaned = 0;
    const now = Date.now();
    for (const [id, rumor] of this.rumors) {
      const age = (now - rumor.createdAt) / 60000;
      if (age > rumor.lifetime) {
        this.rumors.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  getActiveRumors(): Rumor[] {
    return Array.from(this.rumors.values());
  }

  getRumorsAbout(targetId: string): Rumor[] {
    return Array.from(this.rumors.values()).filter(r => r.targetId === targetId);
  }
}