/**
 * [20] 다중 턴 장기 서사 체인 이벤트 전용 상태 스택 관리자
 *
 * NarrativeStackManager:
 *   - 중첩 트랜잭션 상태 스택(Nested Transaction Stack)
 *   - 예외 조건(타겟 사망/도시 함락) → Rollback + 우회 이벤트 강제 삽입
 *   - ex) 삼고초려 시 제갈량 사망 시 서서 등용 이벤트로 우회
 */
export interface NarrativeEvent {
    readonly id: string;
    readonly name: string;
    readonly turnNumber: number;
    readonly requiredOfficerId?: string;
    readonly requiredCityId?: string;
    readonly data: Record<string, unknown>;
    readonly fallbackEventId?: string;
}
export interface NarrativeStackFrame {
    readonly narrativeId: string;
    readonly currentStep: number;
    readonly totalSteps: number;
    readonly events: readonly NarrativeEvent[];
    readonly eventIndex: number;
    readonly rollbackOnFailure: boolean;
    readonly fallbackEvent: NarrativeEvent | null;
}
export declare class NarrativeStackManager {
    private stack;
    /**
     * [20] 새 서사 체인 시작 (push)
     */
    beginNarrative(narrative: NarrativeStackFrame): void;
    /**
     * [20] 현재 서사 단계 진행
     */
    advance(): NarrativeEvent | null;
    /**
     * [20] 예외 조건 시 Rollback + 우회
     *
     * 타겟 장수 사망 등 예외 발생:
     * - rollbackOnFailure=true → 현재 프레임 롤백
     * - fallbackEvent 존재 → 우회 이벤트 강제 삽입
     */
    handleException(officerDead?: string, cityFallen?: string): NarrativeEvent | null;
    getCurrentFrame(): NarrativeStackFrame | null;
    isNarrativeActive(): boolean;
    private completeCurrent;
}
//# sourceMappingURL=narrative_stack_manager.d.ts.map