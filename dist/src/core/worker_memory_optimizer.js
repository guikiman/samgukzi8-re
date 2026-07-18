/**
 * [Task 85] 워커 메모리 절약 팁 — WorkerMemoryOptimizer
 *
 * Web Worker 내 메모리 사용량을 최적화하는 전략 제공.
 * 객체 풀링, SharedArrayBuffer, 구조적 공유 등을 활용.
 */
export class WorkerMemoryOptimizer {
    constructor() {
        this.objectPoolSize = 0;
        this.transferableCount = 0;
        this.sharedBufferCount = 0;
    }
    /**
     * 객체 풀링 권장 사항 반환
     */
    getPoolingAdvice(currentPoolSize) {
        const advice = currentPoolSize < 100
            ? "객체 풀 크기 증가 권장. 최소 100개 이상의 풀을 유지하여 GC 부하 감소."
            : currentPoolSize < 500
                ? "객체 풀 크기 적절. 500개 이상으로 확장 시 추가 이점 제한적."
                : "객체 풀 크기 충분. 현재 크기 유지 권장.";
        return {
            category: "Object Pooling",
            advice,
            estimatedSaving: `${Math.round(currentPoolSize * 0.1)}KB/turn`,
            priority: currentPoolSize < 100 ? "HIGH" : "MEDIUM",
        };
    }
    /**
     * Transferable 객체 사용 권장
     */
    getTransferableAdvice(useTransferables) {
        return {
            category: "Transferable Objects",
            advice: useTransferables
                ? "Transferable 객체 사용 중. ArrayBuffer/OffscreenCanvas 전송 시 메모리 복사 방지됨."
                : "Transferable 객체 미사용 감지. postMessage 시 structured clone 대신 transferList 활용 권장. 50% 이상 메모리 절약 가능.",
            estimatedSaving: "30-50%",
            priority: useTransferables ? "LOW" : "HIGH",
        };
    }
    /**
     * SharedArrayBuffer 사용 권장
     */
    getSharedBufferAdvice(useSharedBuffer) {
        return {
            category: "SharedArrayBuffer",
            advice: useSharedBuffer
                ? "SharedArrayBuffer 활성화. Atomics API로 락-프리 동기화 중."
                : "SharedArrayBuffer 미사용. 대규모 데이터 공유 시 60% 이상 메모리 절약 가능. 단, Cross-Origin Isolation 필요.",
            estimatedSaving: "40-60%",
            priority: useSharedBuffer ? "LOW" : "MEDIUM",
        };
    }
    /**
     * 중간 데이터 정리 권장
     */
    getCleanupAdvice(lastCleanupTurn, currentTurn) {
        const turnsSinceCleanup = currentTurn - lastCleanupTurn;
        return {
            category: "Periodic Cleanup",
            advice: turnsSinceCleanup > 10
                ? `${turnsSinceCleanup}턴 동안 정리 없음. 중간 버퍼, 임시 객체, 캐시 정리 권장.`
                : "주기적 정리 적절.",
            estimatedSaving: `${Math.min(turnsSinceCleanup * 5, 100)}KB`,
            priority: turnsSinceCleanup > 10 ? "HIGH" : "LOW",
        };
    }
    /**
     * 종합 최적화 보고서
     */
    getFullReport() {
        const advices = [
            this.getPoolingAdvice(this.objectPoolSize),
            this.getTransferableAdvice(this.transferableCount > 0),
            this.getSharedBufferAdvice(this.sharedBufferCount > 0),
            {
                category: "WeakMap/WeakRef",
                advice: "WeakMap과 WeakRef를 활용한 자동 GC 유도. 순환 참조 방지.",
                estimatedSaving: "지속적",
                priority: "MEDIUM",
            },
            {
                category: "String Interning",
                advice: "자주 사용되는 문자열(이름, 도시명 등)을 인터닝하여 중복 저장 방지.",
                estimatedSaving: "5-10%",
                priority: "LOW",
            },
        ];
        return {
            totalAdviceCount: advices.length,
            highPriorityCount: advices.filter((a) => a.priority === "HIGH").length,
            appliedStrategies: [
                ...(this.objectPoolSize > 0 ? ["Object Pooling"] : []),
                ...(this.transferableCount > 0 ? ["Transferable Objects"] : []),
                ...(this.sharedBufferCount > 0 ? ["SharedArrayBuffer"] : []),
            ],
            estimatedTotalSaving: "50-200KB/turn",
        };
    }
    recordPoolSize(size) { this.objectPoolSize = size; }
    recordTransferable() { this.transferableCount++; }
    recordSharedBuffer() { this.sharedBufferCount++; }
    reset() {
        this.objectPoolSize = 0;
        this.transferableCount = 0;
        this.sharedBufferCount = 0;
    }
}
//# sourceMappingURL=worker_memory_optimizer.js.map