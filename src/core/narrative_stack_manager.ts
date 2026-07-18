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
    readonly fallbackEventId?: string; // 우회 이벤트 ID
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

export class NarrativeStackManager {
    private stack: NarrativeStackFrame[] = [];

    /**
     * [20] 새 서사 체인 시작 (push)
     */
    beginNarrative(narrative: NarrativeStackFrame): void {
        this.stack.push(narrative);
    }

    /**
     * [20] 현재 서사 단계 진행
     */
    advance(): NarrativeEvent | null {
        const current = this.stack[this.stack.length - 1];
        if (!current) return null;

        const event = current.events[current.eventIndex];
        if (!event) {
            this.completeCurrent();
            return null;
        }

        const updated: NarrativeStackFrame = {
            ...current,
            eventIndex: current.eventIndex + 1,
        };
        this.stack[this.stack.length - 1] = updated;
        return event;
    }

    /**
     * [20] 예외 조건 시 Rollback + 우회
     *
     * 타겟 장수 사망 등 예외 발생:
     * - rollbackOnFailure=true → 현재 프레임 롤백
     * - fallbackEvent 존재 → 우회 이벤트 강제 삽입
     */
    handleException(officerDead?: string, cityFallen?: string): NarrativeEvent | null {
        const current = this.stack[this.stack.length - 1];
        if (!current) return null;

        const shouldRollback = current.rollbackOnFailure &&
            (officerDead || cityFallen);

        if (shouldRollback) {
            // 현재 프레임 롤백
            const rolledBack: NarrativeStackFrame = {
                ...current,
                eventIndex: Math.max(0, current.eventIndex - 1),
            };
            this.stack[this.stack.length - 1] = rolledBack;

            // 우회 이벤트가 있으면 반환
            if (current.fallbackEvent) {
                return current.fallbackEvent;
            }
        }

        return null;
    }

    getCurrentFrame(): NarrativeStackFrame | null {
        return this.stack[this.stack.length - 1] ?? null;
    }

    isNarrativeActive(): boolean { return this.stack.length > 0; }

    private completeCurrent(): void {
        this.stack.pop();
    }
}
