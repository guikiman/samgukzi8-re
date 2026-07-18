/**
 * [Task 45] 게임 오버 판정 스캐너
 *
 * 매 턴 종료 시점에서 생존한 플레이어/세력 상태를 검사해
 * GAME_OVER로 안전하게 천이.
 */
import { FactionState } from "./sisyphus_orchestrator";
export interface GameOverResult {
    readonly isGameOver: boolean;
    readonly winnerId?: string;
    readonly reason?: string;
}
export declare class GameOverScanner {
    scan(factions: Map<string, FactionState>, playerFactionId: string): GameOverResult;
}
//# sourceMappingURL=game_over_scanner.d.ts.map