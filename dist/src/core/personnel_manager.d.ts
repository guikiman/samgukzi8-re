/**
 * [64-67] 인사: 등용/천거, 포상/수여, 몰수, 해고
 * [68-69] 신분 임명: 군사, 도독, 태수
 * [150] 이중 스파이 심기 / [159] 이간질·소문 조작
 * [351] 이민족 용병 고용 / [352] 망명 정부 수용
 *
 * Python 원본: src/systems/diplomacy_manager.py → TypeScript 포팅
 * - PersonnelManager: 무장 등용/포상/몰수/해고/임명
 * - SchemeManager: 파괴(성벽), 이간(충성도 저하), 용병/망명
 *
 * 외교(FactionRelation, 동맹/파기/항복권고/증정/원군)는 이미
 * src/core/diplomacy_engine.ts가 커버하므로 본 모듈은 인사/계략에 한정한다.
 *
 * 재현성(reproducibility)을 위해 Math.random 대신 주입 가능한 PRNG를 사용한다.
 * 기본값은 결정적 시드 기반 mulberry32이다.
 */
export type OfficerRank = 'ruler' | 'viceroy' | 'prefect' | 'strategist' | 'regular' | 'recluse' | 'free';
export interface OfficerRecord {
    id: string;
    name: string;
    factionId: string | null;
    loyalty: number;
    rank: OfficerRank;
    items: string[];
}
export interface PersonnelResult {
    success: boolean;
    message: string;
    /** 등용/몰수 등 성공 시 부가 정보 */
    confiscatedCount?: number;
    loyaltyGain?: number;
    loyaltyDrop?: number;
}
/** 결정적 PRNG — mulberry32 */
export type PRNG = () => number;
export declare function createSeededPRNG(seed: number): PRNG;
export declare class PersonnelManager {
    private readonly rng;
    private officers;
    constructor(rng?: PRNG);
    /** 테스트/시나리오 주입용 무장 등록 */
    registerOfficer(officer: OfficerRecord): void;
    getOfficer(officerId: string): OfficerRecord | null;
    /** 등용 확률 미리보기 (UI용) — 로직은 recruit과 동일 기준 */
    getRecruitChance(targetId: string, recruiterFaction: string): number;
    /** [64] 등용 — 무장 확보 시도 */
    recruit(recruiterId: string, targetId: string, recruiterFaction: string, loyaltyBonus?: number): PersonnelResult;
    /** [65] 포상 — 금으로 충성도 상승 */
    reward(officerId: string, goldAmount: number): PersonnelResult;
    /** [66] 몰수 — 같은 세력 무장의 아이템 몰수 (충성도 -30) */
    confiscate(rulerId: string, targetId: string): PersonnelResult;
    /** [67] 해고 — 재야로 방출 */
    dismiss(rulerId: string, targetId: string): PersonnelResult;
    /** [68-69] 임명 — 군사/도독/태수 등 신분 부여 */
    appoint(officerId: string, rank: Exclude<OfficerRank, 'recluse' | 'free'>): PersonnelResult;
}
export interface SchemeManagerOptions {
    /** 파괴 최소 투자금 (기본 100) */
    sabotageMinInvestment?: number;
    /** 이간 최소 투자금 (기본 200) */
    sowDiscordMinInvestment?: number;
}
export declare class SchemeManager {
    private readonly rng;
    private readonly options;
    private personnel;
    constructor(personnel?: PersonnelManager, rng?: PRNG, options?: SchemeManagerOptions);
    /** [74] 파괴 — 대상 도시 성벽 파괴 시도 */
    sabotage(targetCityId: string, investment: number): PersonnelResult;
    /** [75] 이간 — 대상 무장 충성도 저하 시도 */
    sowDiscord(targetOfficer: string, investment: number): PersonnelResult;
    /** [150] 이중 스파이 심기 — 30% 확률 */
    plantSpy(officerId: string): PersonnelResult;
    /** [159] 외교 이간질 및 소문 조작 */
    spreadRumor(targetFaction: string, content: string): PersonnelResult;
    /** [351] 이민족 용병 고용 */
    hireBarbarianMercenary(factionId: string, tribe: string): boolean;
    /** [352] 망명 정부 수용 */
    acceptExileGovernment(hostFaction: string, guestFaction: string): boolean;
}
//# sourceMappingURL=personnel_manager.d.ts.map