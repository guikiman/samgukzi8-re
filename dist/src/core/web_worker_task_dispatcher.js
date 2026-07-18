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
export class WebWorkerTaskDispatcher {
    constructor() {
        this.workers = [];
        this.taskQueue = [];
        this.pendingTasks = new Map();
        this.MAX_WORKERS = 4;
    }
    /**
     * Web Worker 풀 초기화
     */
    init(workerScriptUrl, poolSize = this.MAX_WORKERS) {
        for (let i = 0; i < poolSize; i++) {
            try {
                const worker = new Worker(workerScriptUrl);
                worker.onmessage = (event) => this.handleWorkerMessage(event.data);
                worker.onerror = (event) => this.handleWorkerError(event);
                this.workers.push(worker);
            }
            catch {
                // Worker 생성 실패: 메인 스레드 폴백
            }
        }
    }
    /**
     * 태스트 디스패치
     */
    async dispatchTask(task) {
        const taskWithId = {
            ...task,
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        };
        if (this.workers.length === 0) {
            // Worker 없음: 메인 스레드에서 실행 (자리표시)
            return this.executeSyncFallback(taskWithId);
        }
        return new Promise((resolve, reject) => {
            this.pendingTasks.set(taskWithId.id, { resolve, reject });
            // 가용 Worker에 즉시 할당, 없으면 큐잉
            const availableWorker = this.workers.find(w => !this.isWorkerBusy(w));
            if (availableWorker) {
                availableWorker.postMessage(taskWithId);
            }
            else {
                this.taskQueue.push(taskWithId);
            }
        });
    }
    isWorkerBusy(_worker) {
        // 간이 추정: pendingTasks 수가 worker 수보다 많으면 busy
        return this.pendingTasks.size >= this.workers.length;
    }
    handleWorkerMessage(data) {
        const pending = this.pendingTasks.get(data.taskId);
        if (pending) {
            if (data.success) {
                pending.resolve(data.data);
            }
            else {
                pending.reject(new Error(data.error ?? 'Worker task failed'));
            }
            this.pendingTasks.delete(data.taskId);
        }
        // 큐에 대기 중인 태스트 처리
        this.processQueue();
    }
    handleWorkerError(event) {
        console.error('Worker error:', event.message);
    }
    processQueue() {
        if (this.taskQueue.length === 0)
            return;
        const next = this.taskQueue.shift();
        const worker = this.workers.find(w => !this.isWorkerBusy(w));
        if (worker) {
            worker.postMessage(next);
        }
        else {
            this.taskQueue.unshift(next); // 다시 큐잉
        }
    }
    /** 메인 스레드 폴백 실행 */
    async executeSyncFallback(task) {
        // 자리표시: 실제 연산 로직
        return { taskId: task.id, status: 'completed' };
    }
    /** 모든 Worker 종료 */
    terminateAll() {
        for (const worker of this.workers) {
            worker.terminate();
        }
        this.workers = [];
        this.pendingTasks.clear();
        this.taskQueue = [];
    }
}
//# sourceMappingURL=web_worker_task_dispatcher.js.map