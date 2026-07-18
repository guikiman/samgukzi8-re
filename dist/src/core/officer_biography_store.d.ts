/**
 * [A2] 무장 열전 저장소 — Officer Biography Store
 *
 * OfficerBiographyStore:
 *   1. 1,000명 무장 데이터 O(1) 정규화 맵
 *   2. 생몰년, 성향, 열전 데이터
 *   3. 수명 임계치 자연사 이벤트
 *   4. 이름/별명으로 검색
 */
export interface OfficerBio {
    readonly id: string;
    readonly name: string;
    readonly chineseName: string;
    readonly aliases: string[];
    readonly birthYear: number;
    readonly deathYear: number;
    readonly biography: string;
    readonly personality: string;
    readonly skills: string[];
    readonly portrait?: string;
}
export interface NaturalDeathEvent {
    readonly officerId: string;
    readonly name: string;
    readonly age: number;
    readonly year: number;
}
export declare class OfficerBiographyStore {
    private officers;
    private deathHistory;
    addOfficer(bio: OfficerBio): void;
    getOfficer(id: string): OfficerBio | null;
    searchByName(name: string): OfficerBio[];
    getAllOfficers(): OfficerBio[];
    getOfficersByPersonality(personality: string): OfficerBio[];
    getOfficersBornInYear(year: number): OfficerBio[];
    getOfficersAliveInYear(year: number): OfficerBio[];
    checkNaturalDeaths(year: number): NaturalDeathEvent[];
    getDeathHistory(): NaturalDeathEvent[];
    calculateAge(officerId: string, currentYear: number): number;
    isAlive(officerId: string, currentYear: number): boolean;
    removeOfficer(id: string): boolean;
    clear(): void;
    get count(): number;
}
//# sourceMappingURL=officer_biography_store.d.ts.map