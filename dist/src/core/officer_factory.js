/**
 * [Task 14] 인물 초기화 팩토리 — OfficerBuilder
 *
 * 플루언트 빌더 패턴으로 Officer 인스턴스 생성.
 * 모든 선택적 필드에 기본값을 제공하고 입력값 검증.
 */
export class OfficerBuilder {
    constructor() {
        this._id = "";
        this._name = "";
        this.courtesyName = "";
        this.gender = "M";
        this.birthYear = 150;
        this.deathYear = null;
        this.stats = { leadership: 50, might: 50, intelligence: 50, politics: 50, charisma: 50 };
        this.exp = { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0 };
        this.rank = 0;
        this.status = "FREE";
        this.factionId = null;
        this.cityId = null;
        this.personality = "CALM";
        this.loyalty = 50;
        this.ambition = 50;
        this.morality = 50;
        this.greed = 50;
        this.skills = [];
        this.specialty = null;
        this.fame = 0;
        this.infamy = 0;
        this.merit = 0;
        this.salary = 0;
        this.isFemaleBattleEnabled = false;
        this.hasActedThisTurn = false;
        this.hp = 100;
        this.maxHp = 100;
        this.injuries = 0;
        this.inventory = { weapons: [], mounts: [], treasures: [], books: [] };
    }
    static create(id, name) {
        const b = new OfficerBuilder();
        b._id = id;
        b._name = name;
        return b;
    }
    setCourtesyName(val) { this.courtesyName = val; return this; }
    setGender(val) { this.gender = val; return this; }
    setBirthYear(val) { this.birthYear = val; return this; }
    setDeathYear(val) { this.deathYear = val; return this; }
    setStats(val) { this.stats = { ...this.stats, ...val }; return this; }
    setExp(val) { this.exp = { ...this.exp, ...val }; return this; }
    setRank(val) { this.rank = val; return this; }
    setStatus(val) { this.status = val; return this; }
    setFactionId(val) { this.factionId = val; return this; }
    setCityId(val) { this.cityId = val; return this; }
    setPersonality(val) { this.personality = val; return this; }
    setLoyalty(val) { this.loyalty = val; return this; }
    setAmbition(val) { this.ambition = val; return this; }
    setMorality(val) { this.morality = val; return this; }
    setGreed(val) { this.greed = val; return this; }
    setSkills(val) { this.skills = val; return this; }
    setSpecialty(val) { this.specialty = val; return this; }
    setFame(val) { this.fame = val; return this; }
    setInfamy(val) { this.infamy = val; return this; }
    setMerit(val) { this.merit = val; return this; }
    setSalary(val) { this.salary = val; return this; }
    setInventory(val) { this.inventory = { ...this.inventory, ...val }; return this; }
    setHp(val, max) { this.hp = val; this.maxHp = max; return this; }
    build() {
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
export function createDefaultOfficer(id, name) {
    return OfficerBuilder.create(id, name).build();
}
//# sourceMappingURL=officer_factory.js.map