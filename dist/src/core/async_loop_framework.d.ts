/**
 * [Task 11] 마이크로태스크 기반 비동기 대기 프레임워크
 *
 * CPU 자원 점유율 분산을 위해 requestAnimationFrame +
 * setTimeout 하이브리드 루프 차단기.
 */
export type MicrotaskRunner = () => Promise<boolean>;
export declare class AsyncLoopFramework {
    private running;
    private readonly frameBudget;
    constructor(frameBudget?: number);
    runLoop(task: MicrotaskRunner): Promise<void>;
    stop(): void;
}
//# sourceMappingURL=async_loop_framework.d.ts.map