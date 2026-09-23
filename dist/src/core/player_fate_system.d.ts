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
import type { GameStore } from './game_store.js';
export interface PlayerFateReport {
    /** 플레이어 세력이 이번 판정에서 멸망했는가 */
    playerFactionDestroyed: boolean;
    /** 발화할 이벤트 타입 (멸망 시에만 설정) */
    eventToEmit: 'PLAYER_DEFEAT' | null;
    /** 최종 멸망 원인 요약 (이벤트 payload용) */
    message: string;
}
export declare class PlayerFateSystem {
    private store;
    constructor(store: GameStore);
    /**
     * fate 판정 직후 호출 — 플레이어 세력 존재 여부 확인 [213]
     * @returns 멸망 시 PLAYER_DEFEAT 이벤트 발화 정보, 정상이면 playerFactionDestroyed=false
     */
    checkPlayerFate(): PlayerFateReport;
    /**
     * 멸망 후 잔존 재야 무장 수 — 패배 화면 통계용
     */
    getRemainingFreeOfficers(): number;
}
//# sourceMappingURL=player_fate_system.d.ts.map