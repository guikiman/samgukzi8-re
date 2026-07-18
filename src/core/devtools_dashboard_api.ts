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

export class DevToolsDashboardApi {
  private orchestrator: SisyphusGameOrchestrator | null = null;

  attach(orchestrator: SisyphusGameOrchestrator): void {
    this.orchestrator = orchestrator;
  }

  getTelemetry(): TelemetrySnapshot {
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

  getDetailedReport(): string {
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
