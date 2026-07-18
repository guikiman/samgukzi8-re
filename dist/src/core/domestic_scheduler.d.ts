/**
 * [1] 내정 자동 위임 스케줄러 — 일괄 파견 알고리즘
 * [9] 도시 개발 완료 시 자동 전환
 *
 * ── 아키텍처 ──
 * DomesticScheduler:
 *   Score(officer, task) = politics × 0.4 + charisma × 0.3 + loyalty × 0.2 + leadership × 0.1
 *   → 상위 N명을 빈 내정 슬롯에 자동 매핑
 *
 * ExecutionEngine:
 *   calculateTaskEffect():
 *     baseIncrement = ⌊(primaryStatSum / 12) × budgetModifier × synergyBonus⌋
 *     budgetModifier  = min(1.5, allocatedFunds / 100)
 *     synergyBonus    = 1.0 + (officerCount - 1) × 0.15
 *     successLevel    = roll > 0.9 → CRITICAL (×1.5)
 *                     = roll < 0.1 → FAILURE  (×0.6)
 *                     = else       → SUCCESS  (×1.0)
 *
 * AutoTransitionGuard:
 *   시장/농지 개발도 ≥ max → 자동으로 다른 분야로 전환
 *
 * ── 메모리 안전성 ──
 *   - executeAll() 호출 후 assignments 큐 즉시 clear()
 *   - 무장 행동력 20 차감, 부족 시 등록 단계에서 throw
 *   - 도시 보유 자금(funds) 검증 → 부족 시 throw
 *   - 최대 개발 도달 시 increment clamping
 */
import type { OfficerID, CityID, IGameStore } from './types.js';
/** 내정 분야 열거형 */
export declare enum DomesticTaskType {
    COMMERCE = "COMMERCE",
    FARMING = "FARMING",
    TECHNOLOGY = "TECHNOLOGY",
    PUBLIC_ORDER = "PUBLIC_ORDER",
    REPAIR = "REPAIR"
}
/** 내정 임시 약칭 (autoAssign 호환) */
export type DomesticTask = 'agriculture' | 'commerce' | 'public_order' | 'training' | 'fortify';
/** 자동 추천 결과 */
export interface DomesticAssignment {
    readonly cityId: CityID;
    readonly officerId: OfficerID;
    readonly task: DomesticTask;
    readonly score: number;
}
/** 자동 전환 규칙 */
export interface AutoTransitionRule {
    readonly sourceTask: DomesticTask;
    readonly sourceThreshold: number;
    readonly targetTask: DomesticTask;
}
/** 다중 무장 임무 할당 */
export interface TaskAssignment {
    taskType: DomesticTaskType;
    officerIds: OfficerID[];
    allocatedFunds: number;
}
/** 내정 실행 결과 */
export interface ExecutionResult {
    taskType: DomesticTaskType;
    statChanged: string;
    increment: number;
    currentValue: number;
    fundsConsumed: number;
    successLevel: 'CRITICAL' | 'SUCCESS' | 'FAILURE';
    log: string;
}
export declare class DomesticScheduler {
    private readonly store;
    private assignments;
    /** 최소 할당 비용 */
    private static readonly MIN_FUNDS;
    /** 행동력 소모량 */
    private static readonly AP_COST;
    /** 기본 성공 확률 문턱 */
    private static readonly CRITICAL_THRESHOLD;
    private static readonly FAILURE_THRESHOLD;
    constructor(store: IGameStore);
    /**
     * [1] 일괄 추천 파견: 정치/통솔 점수 기반 자동 매핑
     *
     * 점수 = politics × 0.4 + charisma × 0.3 + loyalty × 0.2 + leadership × 0.1
     * → 반환된 상위 N명을 빈 내정 슬롯에 자동 매핑
     */
    autoAssign(cityId: CityID, slots: DomesticTask[], excludeIds?: Set<OfficerID>): DomesticAssignment[];
    /** 무장의 내정 적성 점수 계산 */
    private calculateScore;
    get pendingCount(): number;
    /**
     * 도시 내정 임무 등록 및 검증
     *
     * @throws 최소 비용 미달, 도시 자금 부족, 무장 행동력 부족
     */
    registerAssignment(cityId: CityID, assignment: TaskAssignment): void;
    /**
     * 등록된 모든 내정 임무 일괄 실행 및 결과 도출 (턴 엔드 시 호출)
     *
     * 각 임무는 calculateTaskEffect()를 통해:
     *   - 도시 자금 차감
     *   - 내정 능력치 상승
     *   - 무장 행동력 차감
     *   - 개발도 상한 도달 시 clamping
     *
     * @returns 실행 결과 배열 (빈 큐이면 [])
     */
    executeAll(): ExecutionResult[];
    /**
     * 원작 삼국지 8 공식 기반 정밀 내정 상승량 계산기
     *
     * 공식:
     *   baseIncrement = ⌊(primaryStatSum / 12) × budgetModifier × synergyBonus⌋
     *   budgetModifier = min(1.5, allocatedFunds / 100)
     *   synergyBonus   = 1.0 + (officerCount - 1) × 0.15
     *   roll > 0.9  → CRITICAL (×1.5)
     *   roll < 0.1  → FAILURE  (×0.6)
     *   else        → SUCCESS  (×1.0)
     */
    private calculateTaskEffect;
    /** 지정된 분야의 현재 수치와 최대 제한 수치를 반환 */
    private getTargetStatDetails;
    /** 실제 도시 객체에 계산된 상승 수치를 안전하게 반영 */
    private applyStatChange;
    /**
     * [9] 도시 개발 완료 시 자동 전환
     *
     * COMMERCE ≥ maxCommerce → PUBLIC_ORDER
     * FARMING  ≥ maxFarming  → TRAINING (fortify 역할)
     * TECHNOLOGY ≥ maxTechnology → REPAIR
     * PUBLIC_ORDER ≥ maxPublicOrder → COMMERCE
     */
    checkAutoTransition(cityId: CityID): AutoTransitionRule | null;
    /**
     * 모든 도시의 자동 전환 규칙을 일괄 스캔
     *
     * @returns { cityId, rule }[] 전환이 필요한 도시 목록
     */
    scanAllAutoTransitions(): {
        cityId: CityID;
        rule: AutoTransitionRule;
    }[];
}
//# sourceMappingURL=domestic_scheduler.d.ts.map