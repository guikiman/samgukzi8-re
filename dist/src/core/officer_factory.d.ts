/**
 * [Task 14] 인물 초기화 팩토리 — OfficerBuilder
 *
 * 플루언트 빌더 패턴으로 Officer 인스턴스 생성.
 * 모든 선택적 필드에 기본값을 제공하고 입력값 검증.
 */
import type { Officer, OfficerID, OfficerStats, OfficerExp, OfficerStatus, OfficerRank, Personality, OfficerInventory, FactionID, CityID } from "./types.js";
export declare class OfficerBuilder {
    private _id;
    private _name;
    private courtesyName;
    private gender;
    private birthYear;
    private deathYear;
    private stats;
    private exp;
    private rank;
    private status;
    private factionId;
    private cityId;
    private personality;
    private loyalty;
    private ambition;
    private morality;
    private greed;
    private skills;
    private specialty;
    private fame;
    private infamy;
    private merit;
    private salary;
    private isFemaleBattleEnabled;
    private hasActedThisTurn;
    private hp;
    private maxHp;
    private injuries;
    private inventory;
    static create(id: OfficerID, name: string): OfficerBuilder;
    setCourtesyName(val: string): this;
    setGender(val: "M" | "F"): this;
    setBirthYear(val: number): this;
    setDeathYear(val: number | null): this;
    setStats(val: Partial<OfficerStats>): this;
    setExp(val: Partial<OfficerExp>): this;
    setRank(val: OfficerRank): this;
    setStatus(val: OfficerStatus): this;
    setFactionId(val: FactionID | null): this;
    setCityId(val: CityID | null): this;
    setPersonality(val: Personality): this;
    setLoyalty(val: number): this;
    setAmbition(val: number): this;
    setMorality(val: number): this;
    setGreed(val: number): this;
    setSkills(val: string[]): this;
    setSpecialty(val: string | null): this;
    setFame(val: number): this;
    setInfamy(val: number): this;
    setMerit(val: number): this;
    setSalary(val: number): this;
    setInventory(val: Partial<OfficerInventory>): this;
    setHp(val: number, max: number): this;
    build(): Officer;
}
export declare function createDefaultOfficer(id: OfficerID, name: string): Officer;
//# sourceMappingURL=officer_factory.d.ts.map