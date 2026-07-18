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

const DEFAULT_CONFIG: LatencyConfig = {
  minLatencyMs: 50,
  maxLatencyMs: 200,
  packetLossRate: 0,
  jitterMs: 10,
};

export class NetworkLatencySimulator {
  private config: LatencyConfig;
  private enabled = false;

  constructor(config?: Partial<LatencyConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  enable(): void { this.enabled = true; }
  disable(): void { this.enabled = false; }
  isEnabled(): boolean { return this.enabled; }

  setConfig(config: Partial<LatencyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LatencyConfig { return { ...this.config }; }

  async simulate<T>(operation: () => T | Promise<T>): Promise<T> {
    if (!this.enabled) return operation();

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

  async simulateFetch<T>(url: string, options?: RequestInit): Promise<Response> {
    if (!this.enabled) return fetch(url, options);

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

  setLatency(minMs: number, maxMs: number): void {
    this.config = { ...this.config, minLatencyMs: minMs, maxLatencyMs: maxMs };
  }

  setPacketLoss(rate: number): void {
    this.config = { ...this.config, packetLossRate: Math.max(0, Math.min(1, rate)) };
  }
}
