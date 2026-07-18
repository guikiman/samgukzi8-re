/**
 * [Task 44] 멀티스레딩 Web Worker 준비 인터페이스
 *
 * CPU 집약적인 AI 탐색 알고리즘 (MCTS, 길찾기)이
 * 메인 스레드를 막지 않도록 Worker 메시지 포트 브릿지.
 */
export interface WorkerMessage {
    readonly type: string;
    readonly payload: unknown;
    readonly id: string;
}
export interface WorkerResponse {
    readonly id: string;
    readonly type: string;
    readonly result: unknown;
    readonly error?: string;
}
export declare class WorkerMessageBridge {
    private worker;
    private pending;
    initialize(workerScript: string): void;
    send(type: string, payload: unknown): Promise<WorkerResponse>;
    terminate(): void;
}
//# sourceMappingURL=worker_message_bridge.d.ts.map