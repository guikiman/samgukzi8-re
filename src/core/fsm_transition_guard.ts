/**
 * [Task 15] FSM 전이 규칙 엔진 (FSM Transition Guard)
 *
 * 정의되지 않은 비정상적 페이즈 이동을 원천 차단하는
 * 상태 전이 유효성 검사.
 */

import { GamePhase } from "./sisyphus_orchestrator";

const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  [GamePhase.INITIALIZING]: [GamePhase.TURN_START],
  [GamePhase.TURN_START]: [GamePhase.COMMAND_INPUT],
  [GamePhase.COMMAND_INPUT]: [GamePhase.RESOLUTION],
  [GamePhase.RESOLUTION]: [GamePhase.TURN_END],
  [GamePhase.TURN_END]: [GamePhase.TURN_START, GamePhase.GAME_OVER],
  [GamePhase.GAME_OVER]: [],
};

export class FsmTransitionGuard {
  canTransition(from: GamePhase, to: GamePhase): boolean {
    const allowed = VALID_TRANSITIONS[from];
    return allowed.includes(to);
  }

  validateOrThrow(from: GamePhase, to: GamePhase): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `[FSM Guard] Invalid transition: ${from} -> ${to}. Allowed from ${from}: [${VALID_TRANSITIONS[from].join(", ")}]`,
      );
    }
  }

  getAllowedNext(from: GamePhase): readonly GamePhase[] {
    return VALID_TRANSITIONS[from];
  }

  isTerminal(phase: GamePhase): boolean {
    return phase === GamePhase.GAME_OVER;
  }
}
