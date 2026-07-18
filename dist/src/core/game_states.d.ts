/**
 * [33-40][44][47][48] 게임 FSM 상태 클래스들
 *
 * 포함 상태:
 *   33. DomesticState - 평정 상태
 *   34. StrategyState - 전략/외교 상태
 *   35. BattleState - 전투 상태
 *   36. EventPlayingState - 이벤트 연출 상태
 *   37. MiniGameBridgeState - 미니게임 상태
 *   38. FiscalSettlementState - 경제 결산 상태
 *   39. MoraleSettlementState - 치안/군량 정산 상태
 *   40. SaveLoadState - 직렬화 상태
 *   44. WorldMapState - 월드맵 상태
 *   47. DebriefingState - 전투 사후 평가 상태
 *   48. GameOverState - 게임 오버 상태
 */
import { FSMState } from './fsm_state.js';
export declare class DomesticState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class StrategyState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class BattleState extends FSMState {
    private battleComplete;
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
    setBattleComplete(): void;
}
export declare class EventPlayingState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class MiniGameBridgeState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class FiscalSettlementState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class MoraleSettlementState extends FSMState {
    constructor();
    onEnter(): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class SaveLoadState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class WorldMapState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class DebriefingState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
export declare class GameOverState extends FSMState {
    constructor();
    onEnter(context: Record<string, unknown>): Promise<void>;
    onUpdate(dt: number): void;
    onExit(): void;
}
//# sourceMappingURL=game_states.d.ts.map