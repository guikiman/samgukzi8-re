import type { FactionID, Personality } from "./types";

export interface FactionProfile {
  readonly id: FactionID;
  readonly name: string;
  readonly power: number;
  readonly cityCount: number;
  readonly aggression: number;
  readonly relationWithTarget: number;
  readonly personality: Personality;
}

export class EncirclementSystem {
  evaluateEncirclement(
    targetFaction: FactionProfile,
    worldFactions: FactionProfile[],
  ): { shouldForm: boolean; members: FactionProfile[]; reason: string } {
    const totalPower = worldFactions.reduce((s, f) => s + f.power, 0);
    const targetPowerRatio = targetFaction.power / Math.max(1, totalPower);

    if (targetPowerRatio < 0.25) {
      return { shouldForm: false, members: [], reason: `${targetFaction.name}이(가) 충분히 강력하지 않음` };
    }

    const potentialMembers = worldFactions.filter(
      (f) =>
        f.id !== targetFaction.id &&
        f.relationWithTarget < -10 &&
        f.power > targetFaction.power * 0.3,
    );

    if (potentialMembers.length < 2) {
      return { shouldForm: false, members: [], reason: "포위망을 구성할 세력 부족" };
    }

    return {
      shouldForm: true,
      members: potentialMembers,
      reason: `${targetFaction.name}이(가) 너무 강력하다! ${potentialMembers.length}개 세력이 포위망을 제안했다.`,
    };
  }

  calculateCohesion(members: FactionProfile[]): number {
    if (members.length < 2) return 0;
    let totalRelation = 0;
    let pairCount = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        totalRelation += members[i].relationWithTarget;
        pairCount++;
      }
    }
    const avgRelation = totalRelation / Math.max(1, pairCount);
    const memberCountBonus = Math.min(0.2, members.length * 0.05);
    return Math.max(0, Math.min(1, (avgRelation + 100) / 200 + memberCountBonus));
  }

  generateEncirclementEvent(
    targetName: string,
    memberCount: number,
    cohesion: number,
  ): string {
    const templates = [
      `${targetName}의 세력이 급속도로 팽창하자, 주변 ${memberCount}개 세력이 맞서기로 결의했다!`,
      `${memberCount}개 세력이 ${targetName}에 대한 공동 전선을 구축했다. (결속력: ${(cohesion * 100).toFixed(0)}%)`,
      `하늘 아래 ${targetName}을(를) 견제하기 위한 대연합이 결성되었다!`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
}