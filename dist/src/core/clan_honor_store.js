/**
 * [Task 42] 가문 평판 점수 관리 — ClanHonorStore
 *
 * 가문(Clan) 단위 명예 점수 추적 및 등급 관리.
 */
export var ClanRank;
(function (ClanRank) {
    ClanRank[ClanRank["UNKNOWN"] = 0] = "UNKNOWN";
    ClanRank[ClanRank["NOBLE"] = 100] = "NOBLE";
    ClanRank[ClanRank["KNIGHT"] = 300] = "KNIGHT";
    ClanRank[ClanRank["BARON"] = 600] = "BARON";
    ClanRank[ClanRank["VISCOUNT"] = 1000] = "VISCOUNT";
    ClanRank[ClanRank["COUNT"] = 1500] = "COUNT";
    ClanRank[ClanRank["MARQUESS"] = 2100] = "MARQUESS";
    ClanRank[ClanRank["DUKE"] = 2800] = "DUKE";
    ClanRank[ClanRank["PRINCE"] = 3600] = "PRINCE";
    ClanRank[ClanRank["ROYAL"] = 5000] = "ROYAL";
})(ClanRank || (ClanRank = {}));
const RANK_NAMES = {
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
    constructor() {
        this.clans = new Map();
        this.idCounter = 0;
    }
    registerClan(id, name, founderId, year) {
        const clan = {
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
    getClan(id) {
        return this.clans.get(id);
    }
    getClanByOfficer(officerId) {
        for (const clan of this.clans.values()) {
            if (clan.memberIds.includes(officerId))
                return clan;
        }
        return undefined;
    }
    addMember(clanId, officerId) {
        const clan = this.clans.get(clanId);
        if (!clan || clan.memberIds.includes(officerId))
            return false;
        clan.memberIds.push(officerId);
        return true;
    }
    removeMember(clanId, officerId) {
        const clan = this.clans.get(clanId);
        if (!clan)
            return false;
        const idx = clan.memberIds.indexOf(officerId);
        if (idx === -1)
            return false;
        clan.memberIds.splice(idx, 1);
        return true;
    }
    setPatriarch(clanId, officerId) {
        const clan = this.clans.get(clanId);
        if (!clan || !clan.memberIds.includes(officerId))
            return false;
        clan.currentPatriarchId = officerId;
        return true;
    }
    earnHonor(clanId, delta, reason, turn, year, month, officerId) {
        const clan = this.clans.get(clanId);
        if (!clan)
            return 0;
        clan.honor += delta;
        if (clan.honor < 0)
            clan.honor = 0;
        clan.rank = this.calculateRank(clan.honor);
        const event = {
            id: `che_${this.idCounter++}_${turn}`,
            clanId, delta, reason, turn, year, month, officerId,
        };
        clan.history.push(event);
        return clan.honor;
    }
    spendHonor(clanId, delta, reason, turn, year, month, officerId) {
        const clan = this.clans.get(clanId);
        if (!clan || clan.honor < delta)
            return { success: false, newTotal: clan?.honor ?? 0 };
        return { success: true, newTotal: this.earnHonor(clanId, -delta, reason, turn, year, month, officerId) };
    }
    calculateRank(honor) {
        const ranks = [
            ClanRank.ROYAL, ClanRank.PRINCE, ClanRank.DUKE, ClanRank.MARQUESS,
            ClanRank.COUNT, ClanRank.VISCOUNT, ClanRank.BARON, ClanRank.KNIGHT, ClanRank.NOBLE,
        ];
        for (const rank of ranks) {
            if (honor >= rank)
                return rank;
        }
        return ClanRank.UNKNOWN;
    }
    getRankName(rank) {
        return RANK_NAMES[rank] ?? "무명";
    }
    getHistory(clanId) {
        return this.clans.get(clanId)?.history ?? [];
    }
    getAllClans() {
        return Array.from(this.clans.values());
    }
    getTopClans(n) {
        return this.getAllClans().sort((a, b) => b.honor - a.honor).slice(0, n);
    }
    getTotalHonor(clanId) {
        return this.clans.get(clanId)?.honor ?? 0;
    }
    removeClan(clanId) {
        return this.clans.delete(clanId);
    }
}
//# sourceMappingURL=clan_honor_store.js.map