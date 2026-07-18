/**
 * [Task 15] FSM 전이 규칙 엔진 (FSM Transition Guard)
 *
 * 정의되지 않은 비정상적 페이즈 이동을 원천 차단하는
 * 상태 전이 유효성 검사.
 */
import { GamePhase } from "./sisyphus_orchestrator";
export declare class FsmTransitionGuard {
    canTransition(from: GamePhase, to: GamePhase): boolean;
    validateOrThrow(from: GamePhase, to: GamePhase): void;
    getAllowedNext(from: GamePhase): readonly GamePhase[];
    isTerminal(phase: GamePhase): boolean;
}
//# sourceMappingURL=fsm_transition_guard.d.ts.map