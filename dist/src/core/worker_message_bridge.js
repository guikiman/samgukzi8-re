/**
 * [Task 44] 멀티스레딩 Web Worker 준비 인터페이스
 *
 * CPU 집약적인 AI 탐색 알고리즘 (MCTS, 길찾기)이
 * 메인 스레드를 막지 않도록 Worker 메시지 포트 브릿지.
 */
export class WorkerMessageBridge {
    constructor() {
        this.worker = null;
        this.pending = new Map();
    }
    initialize(workerScript) {
        this.worker = new Worker(workerScript);
        this.worker.onmessage = (event) => {
            const response = event.data;
            const resolver = this.pending.get(response.id);
            if (resolver) {
                resolver(response);
                this.pending.delete(response.id);
            }
        };
    }
    send(type, payload) {
        const id = crypto.randomUUID();
        const message = { type, payload, id };
        return new Promise((resolve) => {
            this.pending.set(id, resolve);
            this.worker?.postMessage(message);
        });
    }
    terminate() {
        this.worker?.terminate();
        this.worker = null;
        this.pending.clear();
    }
}
//# sourceMappingURL=worker_message_bridge.js.map