/**
 * [Task 50] 엔진 최종 검증용 목(Mock) 렌더러 ASCII 테스트 하네스
 *
 * WebGL 구현 전에 console.log로 턴 흐름, 유닛 상태 변화,
 * 대미지 출력을 즉시 모니터링할 수 있는 경량 테스트 하네스.
 */
import { GameState } from "./sisyphus_orchestrator";
export declare class MockRendererHarness {
    render(state: GameState): string;
    renderSummary(state: GameState): string;
}
//# sourceMappingURL=mock_renderer_harness.d.ts.map