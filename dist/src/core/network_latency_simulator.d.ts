/**
 * [Task 73] 네트워크 지연 모의 시뮬레이터 — NetworkLatencySimulator
 *
 * 개발/테스트 환경에서 네트워크 지연과 패킷 손실을 시뮬레이션.
 */
export interface LatencyConfig {
    readonly minLatencyMs: number;
    readonly maxLatencyMs: number;
    readonly packetLossRate: number;
    readonly jitterMs: number;
}
export declare class NetworkLatencySimulator {
    private config;
    private enabled;
    constructor(config?: Partial<LatencyConfig>);
    enable(): void;
    disable(): void;
    isEnabled(): boolean;
    setConfig(config: Partial<LatencyConfig>): void;
    getConfig(): LatencyConfig;
    simulate<T>(operation: () => T | Promise<T>): Promise<T>;
    simulateFetch<T>(url: string, options?: RequestInit): Promise<Response>;
    setLatency(minMs: number, maxMs: number): void;
    setPacketLoss(rate: number): void;
}
//# sourceMappingURL=network_latency_simulator.d.ts.map