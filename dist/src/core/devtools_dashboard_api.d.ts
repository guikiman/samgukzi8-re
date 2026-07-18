/**
 * [Task 47] 인게임 디버깅 대시보드(DevTools) 상태 API
 *
 * 메모리 큐 크기, 턴 주기, 등록된 이벤트 구독자 수 등의
 * 텔레메트리 데이터를 실시간으로 제공.
 */
import { SisyphusGameOrchestrator, GamePhase } from "./sisyphus_orchestrator";
export interface TelemetrySnapshot {
    readonly phase: GamePhase;
    readonly turn: number;
    readonly calendar: string;
    readonly queueSize: number;
    readonly listenerCount: number;
    readonly tickCount: number;
    readonly memoryEstimate: number;
}
export declare class DevToolsDashboardApi {
    private orchestrator;
    attach(orchestrator: SisyphusGameOrchestrator): void;
    getTelemetry(): TelemetrySnapshot;
    getDetailedReport(): string;
}
//# sourceMappingURL=devtools_dashboard_api.d.ts.map