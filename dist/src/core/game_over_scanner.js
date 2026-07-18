/**
 * [Task 45] 게임 오버 판정 스캐너
 *
 * 매 턴 종료 시점에서 생존한 플레이어/세력 상태를 검사해
 * GAME_OVER로 안전하게 천이.
 */
export class GameOverScanner {
    scan(factions, playerFactionId) {
        const alive = Array.from(factions.values()).filter((f) => f.alive);
        if (alive.length === 0) {
            return { isGameOver: true, reason: "모든 세력이 멸망했습니다." };
        }
        const playerAlive = factions.get(playerFactionId)?.alive ?? false;
        if (!playerAlive) {
            return { isGameOver: true, reason: "플레이어 세력이 멸망했습니다." };
        }
        if (alive.length === 1) {
            return { isGameOver: true, winnerId: alive[0].id, reason: `${alive[0].name}이(가) 천하를 통일했습니다.` };
        }
        return { isGameOver: false };
    }
}
//# sourceMappingURL=game_over_scanner.js.map