/**
 * 플레이어 세력 멸망 정합성 [213] — Player Fate System
 * 파일: src/core/player_fate_system.ts
 *
 * 문제: 24턴 자율 진행 중 플레이어 세력이 AI 전쟁에 의해 멸망하면
 *       playerFactionId가 존재하지 않는 세력을 가리켜 후속 처리(엔딩/보고서/통일 판정)
 *       이 부정확해진다.
 *
 * 해결: FactionFateSystem.checkFates()가 멸망 세력을 정리한 직후 호출하여
 *       1) 플레이어 세력이 소멸했으면 PLAYER_DEFEAT 이벤트 발화 (게임오버 트리거)
 *       2) 플레이어 세력이 유효하면 아무것도 하지 않는다 (정상 경로)
 */
export class PlayerFateSystem {
    constructor(store) {
        this.store = store;
    }
    /**
     * fate 판정 직후 호출 — 플레이어 세력 존재 여부 확인 [213]
     * @returns 멸망 시 PLAYER_DEFEAT 이벤트 발화 정보, 정상이면 playerFactionDestroyed=false
     */
    checkPlayerFate() {
        const gs = this.store.getGlobalState();
        const pf = gs.playerFactionId;
        // 플레이어 세력 미지정 상태 (타이틀 등) — 정상 경로
        if (!pf) {
            return { playerFactionDestroyed: false, eventToEmit: null, message: '' };
        }
        const playerFaction = this.store.getFaction(pf);
        if (playerFaction) {
            // 유효 — 정상 경로
            return { playerFactionDestroyed: false, eventToEmit: null, message: '' };
        }
        // 플레이어 세력 소멸 — 패배 확정
        const year = gs.time.year;
        const month = gs.time.month;
        return {
            playerFactionDestroyed: true,
            eventToEmit: 'PLAYER_DEFEAT',
            message: `💀 ${year}년 ${month}월 — 플레이어 세력이 멸망했습니다. 천하의 주인은 따로 있습니다.`,
        };
    }
    /**
     * 멸망 후 잔존 재야 무장 수 — 패배 화면 통계용
     */
    getRemainingFreeOfficers() {
        return this.store.getAllOfficers().filter(o => o.factionId === null).length;
    }
}
//# sourceMappingURL=player_fate_system.js.map