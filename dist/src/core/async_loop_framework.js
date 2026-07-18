/**
 * [Task 11] 마이크로태스크 기반 비동기 대기 프레임워크
 *
 * CPU 자원 점유율 분산을 위해 requestAnimationFrame +
 * setTimeout 하이브리드 루프 차단기.
 */
export class AsyncLoopFramework {
    constructor(frameBudget = 8) {
        this.running = false;
        this.frameBudget = frameBudget;
    }
    async runLoop(task) {
        this.running = true;
        while (this.running) {
            const start = performance.now();
            const shouldContinue = await task();
            if (!shouldContinue)
                break;
            const elapsed = performance.now() - start;
            if (elapsed < this.frameBudget) {
                await new Promise((r) => setTimeout(r, this.frameBudget - elapsed));
            }
            else {
                await new Promise((r) => requestAnimationFrame(r));
            }
        }
    }
    stop() {
        this.running = false;
    }
}
//# sourceMappingURL=async_loop_framework.js.map