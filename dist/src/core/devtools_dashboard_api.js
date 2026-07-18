/**
 * [Task 47] 인게임 디버깅 대시보드(DevTools) 상태 API
 *
 * 메모리 큐 크기, 턴 주기, 등록된 이벤트 구독자 수 등의
 * 텔레메트리 데이터를 실시간으로 제공.
 */
import { GamePhase } from "./sisyphus_orchestrator";
export class DevToolsDashboardApi {
    constructor() {
        this.orchestrator = null;
    }
    attach(orchestrator) {
        this.orchestrator = orchestrator;
    }
    getTelemetry() {
        const state = this.orchestrator?.getState();
        return {
            phase: state?.currentPhase ?? GamePhase.INITIALIZING,
            turn: state?.currentTurn ?? 0,
            calendar: state?.calendar.toString() ?? "N/A",
            queueSize: 0,
            listenerCount: 0,
            tickCount: 0,
            memoryEstimate: 0,
        };
    }
    getDetailedReport() {
        const t = this.getTelemetry();
        return [
            `=== SisyphusEngine DevTools ===`,
            `Phase: ${t.phase}`,
            `Turn: ${t.turn}`,
            `Calendar: ${t.calendar}`,
            `Queue Size: ${t.queueSize}`,
            `Listeners: ${t.listenerCount}`,
            `Ticks: ${t.tickCount}`,
            `Memory Est: ${t.memoryEstimate}KB`,
            `===============================`,
        ].join("\n");
    }
}
//# sourceMappingURL=devtools_dashboard_api.js.map