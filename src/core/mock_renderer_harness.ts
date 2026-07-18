/**
 * [Task 50] 엔진 최종 검증용 목(Mock) 렌더러 ASCII 테스트 하네스
 *
 * WebGL 구현 전에 console.log로 턴 흐름, 유닛 상태 변화,
 * 대미지 출력을 즉시 모니터링할 수 있는 경량 테스트 하네스.
 */

import { GameState, GamePhase } from "./sisyphus_orchestrator";

export class MockRendererHarness {
  render(state: GameState): string {
    const lines: string[] = [];
    lines.push(`=== Turn ${state.currentTurn} [${state.currentPhase}] ===`);
    lines.push(`Calendar: ${state.calendar.toString()}`);

    for (const [, faction] of state.factions) {
      const officers = Array.from(state.officers.values())
        .filter((o) => o.factionId === faction.id && o.alive);
      lines.push(`[${faction.name}] Gold:${faction.gold} Rice:${faction.rice} Officers:${officers.length}`);
    }

    return lines.join("\n");
  }

  renderSummary(state: GameState): string {
    const lines: string[] = [];
    lines.push(`T${state.currentTurn} P${state.currentPhase}: ${state.calendar.toString()}`);
    lines.push(`Factions: ${state.factions.size}, Officers: ${state.officers.size}, Cities: ${state.cities.size}`);
    return lines.join("\n");
  }
}
