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

export class WorkerMessageBridge {
  private worker: Worker | null = null;
  private pending = new Map<string, (response: WorkerResponse) => void>();

  initialize(workerScript: string): void {
    this.worker = new Worker(workerScript);
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const resolver = this.pending.get(response.id);
      if (resolver) {
        resolver(response);
        this.pending.delete(response.id);
      }
    };
  }

  send(type: string, payload: unknown): Promise<WorkerResponse> {
    const id = crypto.randomUUID();
    const message: WorkerMessage = { type, payload, id };

    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker?.postMessage(message);
    });
  }

  terminate(): void {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}
