import type { ChildGenome } from "./child_genetics";
import type { OfficerID } from "./types";

export interface DebutOfficer {
  readonly id: OfficerID;
  readonly name: string;
  readonly age: number;
  readonly genome: ChildGenome;
  readonly parentIds: [OfficerID, OfficerID];
  readonly mentorId: OfficerID | null;
  readonly debutType: "faction_officer" | "free_retainer" | "wanderer";
}

export class ComingOfAgeSystem {
  private readonly ADULTHOOD_AGE = 15;

  checkComingOfAge(age: number): boolean {
    return age >= this.ADULTHOOD_AGE;
  }

  generateName(fatherName: string, motherName: string, gender: "M" | "F"): string {
    const surnames = [fatherName.charAt(0)];
    const givenMale = ["영", "호", "준", "민", "성", "지", "세", "현", "수", "동"];
    const givenFemale = ["미", "영", "숙", "정", "혜", "희", "진", "란", "순", "은"];
    const given = gender === "M"
      ? givenMale[Math.floor(Math.random() * givenMale.length)]
      : givenFemale[Math.floor(Math.random() * givenFemale.length)];
    return `${surnames[0]}${given}`;
  }

  determineDebut(genome: ChildGenome, parentFactionId: string | null, parentMerit: number): {
    type: DebutOfficer["debutType"];
    startingRank: number;
    startingLoyalty: number;
  } {
    const avgStat = (genome.leadership + genome.might + genome.intelligence + genome.politics + genome.charisma) / 5;
    const startingRank = avgStat >= 75 ? 5 : avgStat >= 55 ? 7 : 9;

    if (parentFactionId && parentMerit > 50) {
      return { type: "faction_officer", startingRank, startingLoyalty: 70 + Math.floor(parentMerit / 10) };
    }
    if (avgStat >= 70) {
      return { type: "free_retainer", startingRank, startingLoyalty: 50 };
    }
    return { type: "wanderer", startingRank, startingLoyalty: 30 };
  }

  generateDebutEvent(childName: string, debutType: DebutOfficer["debutType"], fatherName: string): string {
    const messages: Record<string, string[]> = {
      faction_officer: [`${childName}이(가) ${fatherName}의 휘하 무장으로 정식 임관했다!`, `${childName}: "아버지의 뒤를 잇겠습니다!"`],
      free_retainer: [`${childName}이(가) 재야 무장으로 세상에 나섰다.`, `${childName}의 명성이 주변 세력에 알려지기 시작했다.`],
      wanderer: [`${childName}이(가) 천하를 유랑하며 경험을 쌓기 시작했다.`, `${childName}은(는) 아직 뜻을 정하지 못하고 방랑하고 있다.`],
    };
    const pool = messages[debutType] ?? ["성인이 되었다."];
    return pool[Math.floor(Math.random() * pool.length)];
  }
}