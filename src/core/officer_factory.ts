/**
 * [Task 14] 인물 초기화 팩토리 — OfficerBuilder
 *
 * 플루언트 빌더 패턴으로 Officer 인스턴스 생성.
 * 모든 선택적 필드에 기본값을 제공하고 입력값 검증.
 */

import type { Officer, OfficerID, OfficerStats, OfficerExp, OfficerStatus, OfficerRank, Personality, OfficerInventory, FactionID, CityID } from "./types.js";

export class OfficerBuilder {
  private _id: OfficerID = "";
  private _name = "";
  private courtesyName = "";
  private gender: "M" | "F" = "M";
  private birthYear = 150;
  private deathYear: number | null = null;
  private stats: OfficerStats = { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 };
  private exp: OfficerExp = { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0 };
  private rank: OfficerRank = 0;
  private status: OfficerStatus = "FREE" as OfficerStatus;
  private factionId: FactionID | null = null;
  private cityId: CityID | null = null;
  private personality: Personality = "CALM";
  private loyalty = 50;
  private ambition = 50;
  private morality = 50;
  private greed = 50;
  private skills: string[] = [];
  private specialty: string | null = null;
  private fame = 0;
  private infamy = 0;
  private merit = 0;
  private salary = 0;
  private isFemaleBattleEnabled = false;
  private hasActedThisTurn = false;
  private hp = 100;
  private maxHp = 100;
  private injuries = 0;
  private inventory: OfficerInventory = { weapons: [], mounts: [], treasures: [], books: [] };

  static create(id: OfficerID, name: string): OfficerBuilder {
    const b = new OfficerBuilder();
    b._id = id;
    b._name = name;
    return b;
  }

  setCourtesyName(val: string): this { this.courtesyName = val; return this; }
  setGender(val: "M" | "F"): this { this.gender = val; return this; }
  setBirthYear(val: number): this { this.birthYear = val; return this; }
  setDeathYear(val: number | null): this { this.deathYear = val; return this; }
  setStats(val: Partial<OfficerStats>): this { this.stats = { ...this.stats, ...val }; return this; }
  setExp(val: Partial<OfficerExp>): this { this.exp = { ...this.exp, ...val }; return this; }
  setRank(val: OfficerRank): this { this.rank = val; return this; }
  setStatus(val: OfficerStatus): this { this.status = val; return this; }
  setFactionId(val: FactionID | null): this { this.factionId = val; return this; }
  setCityId(val: CityID | null): this { this.cityId = val; return this; }
  setPersonality(val: Personality): this { this.personality = val; return this; }
  setLoyalty(val: number): this { this.loyalty = val; return this; }
  setAmbition(val: number): this { this.ambition = val; return this; }
  setMorality(val: number): this { this.morality = val; return this; }
  setGreed(val: number): this { this.greed = val; return this; }
  setSkills(val: string[]): this { this.skills = val; return this; }
  setSpecialty(val: string | null): this { this.specialty = val; return this; }
  setFame(val: number): this { this.fame = val; return this; }
  setInfamy(val: number): this { this.infamy = val; return this; }
  setMerit(val: number): this { this.merit = val; return this; }
  setSalary(val: number): this { this.salary = val; return this; }
  setInventory(val: Partial<OfficerInventory>): this { this.inventory = { ...this.inventory, ...val }; return this; }
  setHp(val: number, max: number): this { this.hp = val; this.maxHp = max; return this; }

  build(): Officer {
    return {
      id: this._id,
      name: this._name,
      courtesyName: this.courtesyName,
      gender: this.gender,
      birthYear: this.birthYear,
      deathYear: this.deathYear,
      stats: this.stats,
      exp: this.exp,
      rank: this.rank,
      status: this.status,
      factionId: this.factionId,
      cityId: this.cityId,
      personality: this.personality,
      loyalty: this.loyalty,
      ambition: this.ambition,
      morality: this.morality,
      greed: this.greed,
      actionPoints: 100,
      maxActionPoints: 100,
      stamina: 100,
      maxStamina: 100,
      fame: this.fame,
      infamy: this.infamy,
      merit: this.merit,
      salary: this.salary,
      skills: this.skills,
      specialty: this.specialty,
      inventory: this.inventory,
      isFemaleBattleEnabled: this.isFemaleBattleEnabled,
      hasActedThisTurn: this.hasActedThisTurn,
      hp: this.hp,
      maxHp: this.maxHp,
      injuries: this.injuries,
    };
  }
}

export function createDefaultOfficer(id: OfficerID, name: string): Officer {
  return OfficerBuilder.create(id, name).build();
}
