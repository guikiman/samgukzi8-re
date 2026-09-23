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

// ============================================================
// 1. 타입 정의
// ============================================================

export type OfficerRank =
    | 'ruler'        // 군주
    | 'viceroy'      // 도독
    | 'prefect'      // 태수
    | 'strategist'   // 군사
    | 'regular'      // 일반
    | 'recluse'      // 재야
    | 'free';        // 방랑군

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

export function createSeededPRNG(seed: number): PRNG {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** roll = 1~100 사이 정수 (Python random.randint(1,100) 대응) */
function roll100(rng: PRNG): number {
    return Math.floor(rng() * 100) + 1;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// ============================================================
// 2. PersonnelManager — [64-67] 등용/포상/몰수/해고 + [68-69] 임명
// ============================================================

export class PersonnelManager {
    private officers: Map<string, OfficerRecord> = new Map();

    constructor(private readonly rng: PRNG = createSeededPRNG(0x5a1)) {}

    /** 테스트/시나리오 주입용 무장 등록 */
    registerOfficer(officer: OfficerRecord): void {
        this.officers.set(officer.id, { ...officer });
    }

    getOfficer(officerId: string): OfficerRecord | null {
        return this.officers.get(officerId) ?? null;
    }

    /** 등용 확률 미리보기 (UI용) — 로직은 recruit과 동일 기준 */
    getRecruitChance(targetId: string, recruiterFaction: string): number {
        const target = this.officers.get(targetId);
        if (!target) return 0;
        if (target.factionId === recruiterFaction) return 0;

        let chance = 50;
        if (target.factionId) {
            chance -= Math.floor(target.loyalty / 2);
        }
        return clamp(chance, 1, 100);
    }

    /** [64] 등용 — 무장 확보 시도 */
    recruit(recruiterId: string, targetId: string, recruiterFaction: string, loyaltyBonus = 20): PersonnelResult {
        const result: PersonnelResult = { success: false, message: '' };
        const target = this.officers.get(targetId);
        if (!target) {
            result.message = '대상 무장이 존재하지 않습니다.';
            return result;
        }
        if (target.factionId === recruiterFaction) {
            result.message = '이미 같은 세력 소속입니다.';
            return result;
        }

        const chance = this.getRecruitChance(targetId, recruiterFaction);
        if (roll100(this.rng) <= chance) {
            target.factionId = recruiterFaction;
            target.loyalty = loyaltyBonus;
            target.rank = 'regular';
            result.success = true;
            result.message = `${target.name}을(를) 성공적으로 등용했습니다.`;
        } else {
            result.message = `${target.name}이(가) 등용을 거절했습니다.`;
        }
        return result;
    }

    /** [65] 포상 — 금으로 충성도 상승 */
    reward(officerId: string, goldAmount: number): PersonnelResult {
        const result: PersonnelResult = { success: false, message: '' };
        const officer = this.officers.get(officerId);
        if (!officer) {
            result.message = '무장이 존재하지 않습니다.';
            return result;
        }

        const loyaltyGain = Math.floor(goldAmount / 100);
        officer.loyalty = clamp(officer.loyalty + loyaltyGain, 0, 100);
        result.success = true;
        result.loyaltyGain = loyaltyGain;
        result.message = `충성도가 ${loyaltyGain} 상승했습니다.`;
        return result;
    }

    /** [66] 몰수 — 같은 세력 무장의 아이템 몰수 (충성도 -30) */
    confiscate(rulerId: string, targetId: string): PersonnelResult {
        const result: PersonnelResult = { success: false, message: '' };
        const target = this.officers.get(targetId);
        if (!target) {
            result.message = '대상 무장이 존재하지 않습니다.';
            return result;
        }

        const ruler = this.officers.get(rulerId);
        if (!ruler || target.factionId !== ruler.factionId) {
            result.message = '같은 세력의 무장만 몰수할 수 있습니다.';
            return result;
        }

        const itemCount = target.items.length;
        target.items = [];
        target.loyalty = clamp(target.loyalty - 30, 0, 100);
        result.success = true;
        result.confiscatedCount = itemCount;
        result.message = `아이템 ${itemCount}개를 몰수했습니다. 충성도가 30 하락합니다.`;
        return result;
    }

    /** [67] 해고 — 재야로 방출 */
    dismiss(rulerId: string, targetId: string): PersonnelResult {
        const result: PersonnelResult = { success: false, message: '' };
        const target = this.officers.get(targetId);
        if (!target) {
            result.message = '대상 무장이 존재하지 않습니다.';
            return result;
        }

        target.factionId = null;
        target.rank = 'recluse';
        result.success = true;
        result.message = `${target.name}을(를) 해고했습니다.`;
        return result;
    }

    /** [68-69] 임명 — 군사/도독/태수 등 신분 부여 */
    appoint(officerId: string, rank: Exclude<OfficerRank, 'recluse' | 'free'>): PersonnelResult {
        const result: PersonnelResult = { success: false, message: '' };
        const officer = this.officers.get(officerId);
        if (!officer) {
            result.message = '대상 무장이 존재하지 않습니다.';
            return result;
        }

        officer.rank = rank;
        result.success = true;
        result.message = `${officer.name}을(를) ${rank}로 임명했습니다.`;
        return result;
    }
}

// ============================================================
// 3. SchemeManager — [74-75] 계략(파괴/이간) + [150][159][351][352]
// ============================================================

export interface SchemeManagerOptions {
    /** 파괴 최소 투자금 (기본 100) */
    sabotageMinInvestment?: number;
    /** 이간 최소 투자금 (기본 200) */
    sowDiscordMinInvestment?: number;
}

export class SchemeManager {
    private personnel: PersonnelManager;

    constructor(
        personnel?: PersonnelManager,
        private readonly rng: PRNG = createSeededPRNG(0x5a2),
        private readonly options: SchemeManagerOptions = {},
    ) {
        this.personnel = personnel ?? new PersonnelManager(rng);
    }

    /** [74] 파괴 — 대상 도시 성벽 파괴 시도 */
    sabotage(targetCityId: string, investment: number): PersonnelResult {
        const result: PersonnelResult = { success: false, message: '' };
        const minInvestment = this.options.sabotageMinInvestment ?? 100;
        if (investment < minInvestment) {
            result.message = `최소 ${minInvestment}의 금이 필요합니다.`;
            return result;
        }

        const successChance = Math.min(70, Math.floor(investment / 50));
        if (roll100(this.rng) <= successChance) {
            result.success = true;
            result.message = `${targetCityId}의 성벽을 파괴했습니다.`;
        } else {
            result.message = '파괴 계략이 실패했습니다.';
        }
        return result;
    }

    /** [75] 이간 — 대상 무장 충성도 저하 시도 */
    sowDiscord(targetOfficer: string, investment: number): PersonnelResult {
        const result: PersonnelResult = { success: false, message: '' };
        const minInvestment = this.options.sowDiscordMinInvestment ?? 200;
        if (investment < minInvestment) {
            result.message = `최소 ${minInvestment}의 금이 필요합니다.`;
            return result;
        }

        const successChance = Math.min(60, Math.floor(investment / 100));
        if (roll100(this.rng) <= successChance) {
            const officer = this.personnel.getOfficer(targetOfficer);
            let loyaltyDrop: number | undefined;
            if (officer) {
                loyaltyDrop = 20;
                officer.loyalty = clamp(officer.loyalty - 20, 0, 100);
            }
            result.success = true;
            result.loyaltyDrop = loyaltyDrop;
            result.message = `${targetOfficer}의 충성도가 20 하락했습니다.`;
        } else {
            result.message = '이간질이 실패했습니다.';
        }
        return result;
    }

    /** [150] 이중 스파이 심기 — 30% 확률 */
    plantSpy(officerId: string): PersonnelResult {
        const success = this.rng() < 0.3;
        return { success, message: success ? `${officerId} 스파이 배치 성공` : '스파이 배치 실패' };
    }

    /** [159] 외교 이간질 및 소문 조작 */
    spreadRumor(targetFaction: string, content: string): PersonnelResult {
        return { success: true, message: `${targetFaction}에 "${content}" 소문을 퍼뜨렸습니다.` };
    }

    /** [351] 이민족 용병 고용 */
    hireBarbarianMercenary(factionId: string, tribe: string): boolean {
        // 원본 Python도 항상 true — 비용 정산은 호출부(국고)에서 처리
        return factionId.length > 0 && tribe.length > 0;
    }

    /** [352] 망명 정부 수용 */
    acceptExileGovernment(hostFaction: string, guestFaction: string): boolean {
        return hostFaction !== guestFaction;
    }
}
