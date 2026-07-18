/**
 * [14] 플레이어 수동 턴 종료 인터럽트 핸들러 — PlayerEndTurnInterceptor
 *
 * PlayerEndTurnInterceptor:
 *   1. 유저가 UI 상에서 '턴 종료' 버튼을 눌렀을 때 즉시 현재 이벤트 정산
 *   2. 처리 중이던 명령 큐의 남은 작업을 강제 플러시
 *   3. 현재 활성화된 무장의 제어권을 해제하고 다음 대기 무장으로 이양
 *   4. 턴 타임아웃 가드와 연동하여 이중 호출 방지
 *   5. 이벤트 리스너 시스템을 통해 UI 레이어와 통신
 */
import type { CommandResult } from './types.js';
export type InterruptReason = 'PLAYER_REQUEST' | 'TIMEOUT_FORCED' | 'ALL_ACTIONS_CONSUMED' | 'EMERGENCY_STOP';
export interface EndTurnRequest {
    readonly timestamp: number;
    readonly reason: InterruptReason;
    readonly forceFlush: boolean;
}
export interface EndTurnResult {
    readonly success: boolean;
    readonly flushedCommands: number;
    readonly skippedOfficers: number;
    readonly reason: InterruptReason;
    readonly timestamp: number;
    readonly remainingQueue: number;
}
export interface TurnEndState {
    readonly isInterrupted: boolean;
    readonly lastEndTurnTimestamp: number;
    readonly interruptHistory: EndTurnResult[];
}
export type CommandQueueFlusher = (context: {
    logger: (msg: string) => void;
}) => CommandResult[];
export type TurnAdvancer = () => void;
export type EventEmitter = (event: {
    id: string;
    type: string;
    payload: Record<string, unknown>;
    timestamp: number;
}) => void;
export declare class PlayerEndTurnInterceptor {
    private isInterrupted;
    private lastEndTurnTimestamp;
    private interruptHistory;
    private readonly COOLDOWN_MS;
    private flushCommands;
    private advanceTurn;
    private emitEvent;
    constructor(flushCommands: CommandQueueFlusher, advanceTurn: TurnAdvancer, emitEvent: EventEmitter);
    /**
     * 플레이어의 턴 종료 요청을 처리한다.
     * @param reason 종료 사유
     * @param forceFlush 강제 플러시 여부
     * @returns 처리 결과
     */
    requestEndTurn(reason?: InterruptReason, forceFlush?: boolean): EndTurnResult;
    /**
     * 현재 인터럽트 상태를 반환한다.
     */
    isCurrentlyInterrupted(): boolean;
    /**
     * 마지막 턴 종료 시각을 반환한다.
     */
    getLastEndTurnTimestamp(): number;
    /**
     * 인터럽트 이력을 반환한다.
     */
    getInterruptHistory(): EndTurnResult[];
    /**
     * 상태를 초기화한다.
     */
    clear(): void;
}
//# sourceMappingURL=player_end_turn_interceptor.d.ts.map