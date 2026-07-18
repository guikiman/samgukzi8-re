/**
 * [E37] 고부하 연산 백그라운드 병렬 처리기 — WebWorkerTaskDispatcher
 *
 * 목적: 1,000명 장수 AI 생각 연산 시 60FPS 드랍 방지.
 *       메인 스레드 = 렌더링 전담, Worker = AI 연산 분할.
 *
 * 핵심 로직:
 *   1. postMessage로 Worker에 데이터 송출
 *   2. 연산 결과 역반영
 */
export type WorkerTaskType = 'AI_DECISION' | 'PATHFINDING' | 'BATTLE_SIMULATION' | 'DATA_COMPRESSION';
export interface WorkerTask {
    readonly id: string;
    readonly type: WorkerTaskType;
    readonly payload: unknown;
    readonly priority: number;
}
export interface WorkerTaskResult {
    readonly taskId: string;
    readonly success: boolean;
    readonly data: unknown;
    readonly error?: string;
}
export declare class WebWorkerTaskDispatcher {
    private workers;
    private taskQueue;
    private pendingTasks;
    private readonly MAX_WORKERS;
    /**
     * Web Worker 풀 초기화
     */
    init(workerScriptUrl: string, poolSize?: number): void;
    /**
     * 태스트 디스패치
     */
    dispatchTask(task: Omit<WorkerTask, 'id'>): Promise<unknown>;
    private isWorkerBusy;
    private handleWorkerMessage;
    private handleWorkerError;
    private processQueue;
    /** 메인 스레드 폴백 실행 */
    private executeSyncFallback;
    /** 모든 Worker 종료 */
    terminateAll(): void;
}
//# sourceMappingURL=web_worker_task_dispatcher.d.ts.map