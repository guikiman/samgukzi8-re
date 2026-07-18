/**
 * [Task 42] 가문 평판 점수 관리 — ClanHonorStore
 *
 * 가문(Clan) 단위 명예 점수 추적 및 등급 관리.
 */

import type { OfficerID } from "./types.js";

export type ClanID = string;

export interface ClanHonorEvent {
  readonly id: string;
  readonly clanId: ClanID;
  readonly delta: number;
  readonly reason: string;
  readonly turn: number;
  readonly year: number;
  readonly month: number;
  readonly officerId?: OfficerID;
}

export enum ClanRank {
  UNKNOWN = 0,
  NOBLE = 100,
  KNIGHT = 300,
  BARON = 600,
  VISCOUNT = 1000,
  COUNT = 1500,
  MARQUESS = 2100,
  DUKE = 2800,
  PRINCE = 3600,
  ROYAL = 5000,
}

export interface ClanData {
  readonly id: ClanID;
  readonly name: string;
  readonly founderId: OfficerID;
  currentPatriarchId: OfficerID;
  honor: number;
  rank: ClanRank;
  memberIds: OfficerID[];
  readonly foundedYear: number;
  readonly history: ClanHonorEvent[];
  motto: string;
  crest: string;
}

const RANK_NAMES: Record<ClanRank, string> = {
  [ClanRank.UNKNOWN]: "무명",
  [ClanRank.NOBLE]: "사족",
  [ClanRank.KNIGHT]: "기사",
  [ClanRank.BARON]: "남작",
  [ClanRank.VISCOUNT]: "자작",
  [ClanRank.COUNT]: "백작",
  [ClanRank.MARQUESS]: "후작",
  [ClanRank.DUKE]: "공작",
  [ClanRank.PRINCE]: "왕자",
  [ClanRank.ROYAL]: "왕족",
};

export class ClanHonorStore {
  private clans = new Map<ClanID, ClanData>();
  private idCounter = 0;

  registerClan(id: ClanID, name: string, founderId: OfficerID, year: number): ClanData {
    const clan: ClanData = {
      id, name, founderId,
      currentPatriarchId: founderId,
      honor: 0,
      rank: ClanRank.UNKNOWN,
      memberIds: [founderId],
      foundedYear: year,
      history: [],
      motto: "",
      crest: "",
    };
    this.clans.set(id, clan);
    return clan;
  }

  getClan(id: ClanID): ClanData | undefined {
    return this.clans.get(id);
  }

  getClanByOfficer(officerId: OfficerID): ClanData | undefined {
    for (const clan of this.clans.values()) {
      if (clan.memberIds.includes(officerId)) return clan;
    }
    return undefined;
  }

  addMember(clanId: ClanID, officerId: OfficerID): boolean {
    const clan = this.clans.get(clanId);
    if (!clan || clan.memberIds.includes(officerId)) return false;
    clan.memberIds.push(officerId);
    return true;
  }

  removeMember(clanId: ClanID, officerId: OfficerID): boolean {
    const clan = this.clans.get(clanId);
    if (!clan) return false;
    const idx = clan.memberIds.indexOf(officerId);
    if (idx === -1) return false;
    clan.memberIds.splice(idx, 1);
    return true;
  }

  setPatriarch(clanId: ClanID, officerId: OfficerID): boolean {
    const clan = this.clans.get(clanId);
    if (!clan || !clan.memberIds.includes(officerId)) return false;
    clan.currentPatriarchId = officerId;
    return true;
  }

  earnHonor(clanId: ClanID, delta: number, reason: string, turn: number, year: number, month: number, officerId?: OfficerID): number {
    const clan = this.clans.get(clanId);
    if (!clan) return 0;
    clan.honor += delta;
    if (clan.honor < 0) clan.honor = 0;
    clan.rank = this.calculateRank(clan.honor);
    const event: ClanHonorEvent = {
      id: `che_${this.idCounter++}_${turn}`,
      clanId, delta, reason, turn, year, month, officerId,
    };
    clan.history.push(event);
    return clan.honor;
  }

  spendHonor(clanId: ClanID, delta: number, reason: string, turn: number, year: number, month: number, officerId?: OfficerID): { success: boolean; newTotal: number } {
    const clan = this.clans.get(clanId);
    if (!clan || clan.honor < delta) return { success: false, newTotal: clan?.honor ?? 0 };
    return { success: true, newTotal: this.earnHonor(clanId, -delta, reason, turn, year, month, officerId) };
  }

  calculateRank(honor: number): ClanRank {
    const ranks = [
      ClanRank.ROYAL, ClanRank.PRINCE, ClanRank.DUKE, ClanRank.MARQUESS,
      ClanRank.COUNT, ClanRank.VISCOUNT, ClanRank.BARON, ClanRank.KNIGHT, ClanRank.NOBLE,
    ];
    for (const rank of ranks) {
      if (honor >= rank) return rank;
    }
    return ClanRank.UNKNOWN;
  }

  getRankName(rank: ClanRank): string {
    return RANK_NAMES[rank] ?? "무명";
  }

  getHistory(clanId: ClanID): ClanHonorEvent[] {
    return this.clans.get(clanId)?.history ?? [];
  }

  getAllClans(): ClanData[] {
    return Array.from(this.clans.values());
  }

  getTopClans(n: number): ClanData[] {
    return this.getAllClans().sort((a, b) => b.honor - a.honor).slice(0, n);
  }

  getTotalHonor(clanId: ClanID): number {
    return this.clans.get(clanId)?.honor ?? 0;
  }

  removeClan(clanId: ClanID): boolean {
    return this.clans.delete(clanId);
  }
}
