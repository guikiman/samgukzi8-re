/**
 * [26] 설전/일기토 트리거 및 결과 콜백 레지스트리 — MiniGameBridgeRegistry
 *
 * MiniGameBridgeRegistry:
 *   1. 이벤트 도중 미니게임이 시작될 때 게임 루프를 일시정지
 *   2. 미니게임의 승패 결과 데이터를 받아 이벤트 분기로 되돌려주는 양방향 브리지
 *   3. 설전(Debate)과 일기토(Duel) 두 가지 미니게임 타입 지원
 */
export class MiniGameBridgeRegistry {
    constructor() {
        this.pendingGames = new Map();
        this.completedResults = [];
        this.isGameActive = false;
    }
    requestMiniGame(type, participants, context = {}) {
        return new Promise((resolve, reject) => {
            const id = `minigame_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const request = {
                id,
                type,
                participants,
                context,
                onComplete: (result) => {
                    this.isGameActive = false;
                    this.completedResults.push(result);
                    resolve(result);
                },
                onCancel: () => {
                    this.pendingGames.delete(id);
                    this.isGameActive = false;
                    reject(new Error('MiniGame cancelled'));
                },
            };
            this.pendingGames.set(id, {
                request,
                startedAt: Date.now(),
                isActive: true,
            });
            this.isGameActive = true;
        });
    }
    submitResult(result) {
        const pending = this.pendingGames.get(result.requestId);
        if (!pending || !pending.isActive)
            return false;
        pending.isActive = false;
        pending.request.onComplete(result);
        this.pendingGames.delete(result.requestId);
        return true;
    }
    cancelGame(requestId) {
        const pending = this.pendingGames.get(requestId);
        if (!pending || !pending.isActive)
            return false;
        pending.isActive = false;
        pending.request.onCancel();
        this.pendingGames.delete(requestId);
        return true;
    }
    getActiveGame() {
        for (const pending of this.pendingGames.values()) {
            if (pending.isActive)
                return pending.request;
        }
        return null;
    }
    isMiniGameInProgress() {
        return this.isGameActive;
    }
    getCompletedResults() {
        return [...this.completedResults];
    }
    clear() {
        for (const pending of this.pendingGames.values()) {
            if (pending.isActive)
                pending.request.onCancel();
        }
        this.pendingGames.clear();
        this.completedResults = [];
        this.isGameActive = false;
    }
}
//# sourceMappingURL=minigame_bridge_registry.js.map