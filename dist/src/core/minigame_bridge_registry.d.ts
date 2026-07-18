/**
 * [26] 설전/일기토 트리거 및 결과 콜백 레지스트리 — MiniGameBridgeRegistry
 *
 * MiniGameBridgeRegistry:
 *   1. 이벤트 도중 미니게임이 시작될 때 게임 루프를 일시정지
 *   2. 미니게임의 승패 결과 데이터를 받아 이벤트 분기로 되돌려주는 양방향 브리지
 *   3. 설전(Debate)과 일기토(Duel) 두 가지 미니게임 타입 지원
 */
export type MiniGameType = 'DEBATE' | 'DUEL';
export interface MiniGameRequest {
    readonly id: string;
    readonly type: MiniGameType;
    readonly participants: string[];
    readonly context: Record<string, unknown>;
    readonly onComplete: (result: MiniGameResult) => void;
    readonly onCancel: () => void;
}
export interface MiniGameResult {
    readonly requestId: string;
    readonly type: MiniGameType;
    readonly winner: string;
    readonly loser: string;
    readonly isDraw: boolean;
    readonly details: Record<string, unknown>;
}
export declare class MiniGameBridgeRegistry {
    private pendingGames;
    private completedResults;
    private isGameActive;
    requestMiniGame(type: MiniGameType, participants: string[], context?: Record<string, unknown>): Promise<MiniGameResult>;
    submitResult(result: MiniGameResult): boolean;
    cancelGame(requestId: string): boolean;
    getActiveGame(): MiniGameRequest | null;
    isMiniGameInProgress(): boolean;
    getCompletedResults(): MiniGameResult[];
    clear(): void;
}
//# sourceMappingURL=minigame_bridge_registry.d.ts.map