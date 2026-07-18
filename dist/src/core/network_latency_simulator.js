/**
 * [Task 73] 네트워크 지연 모의 시뮬레이터 — NetworkLatencySimulator
 *
 * 개발/테스트 환경에서 네트워크 지연과 패킷 손실을 시뮬레이션.
 */
const DEFAULT_CONFIG = {
    minLatencyMs: 50,
    maxLatencyMs: 200,
    packetLossRate: 0,
    jitterMs: 10,
};
export class NetworkLatencySimulator {
    constructor(config) {
        this.enabled = false;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
    isEnabled() { return this.enabled; }
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    getConfig() { return { ...this.config }; }
    async simulate(operation) {
        if (!this.enabled)
            return operation();
        if (Math.random() < this.config.packetLossRate) {
            throw new Error("Simulated network error: packet loss");
        }
        const baseLatency = this.config.minLatencyMs
            + Math.random() * (this.config.maxLatencyMs - this.config.minLatencyMs);
        const jitter = (Math.random() - 0.5) * 2 * this.config.jitterMs;
        const totalLatency = Math.max(0, baseLatency + jitter);
        await new Promise((resolve) => setTimeout(resolve, totalLatency));
        return operation();
    }
    async simulateFetch(url, options) {
        if (!this.enabled)
            return fetch(url, options);
        if (Math.random() < this.config.packetLossRate) {
            throw new Error(`Simulated network error: request to ${url} lost`);
        }
        const baseLatency = this.config.minLatencyMs
            + Math.random() * (this.config.maxLatencyMs - this.config.minLatencyMs);
        const jitter = (Math.random() - 0.5) * 2 * this.config.jitterMs;
        const totalLatency = Math.max(0, baseLatency + jitter);
        await new Promise((resolve) => setTimeout(resolve, totalLatency));
        return fetch(url, options);
    }
    setLatency(minMs, maxMs) {
        this.config = { ...this.config, minLatencyMs: minMs, maxLatencyMs: maxMs };
    }
    setPacketLoss(rate) {
        this.config = { ...this.config, packetLossRate: Math.max(0, Math.min(1, rate)) };
    }
}
//# sourceMappingURL=network_latency_simulator.js.map