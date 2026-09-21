/**
 * 세력 운명 시스템 — 멸망/통일 판정 [213][218]
 *
 * 매월 말 정산 후 호출:
 * 1) 도시 0개 세력 = 멸망 → 소속 무장은 재야(FREE)로 방출
 * 2) 생존 세력 1개 = 통일 → 엔딩 판정 (플레이어 세력이면 승리, 아니면 패배)
 */
import type { GameStore } from './game_store.js';
export type GameEnding = 'PLAYER_UNIFICATION' | 'AI_UNIFICATION' | null;
export interface FactionFateReport {
    destroyedFactionIds: string[];
    destroyedFactionNames: string[];
    ending: GameEnding;
    winnerFactionName: string | null;
}
export declare class FactionFateSystem {
    private store;
    constructor(store: GameStore);
    /** 멸망 판정 + 통일 확인 — 월말 정산 후 호출 */
    checkFates(): FactionFateReport;
    /** 멸망 세력을 스토어에서 제거 (엔딩/정리용) */
    purgeFaction(factionId: string): void;
}
//# sourceMappingURL=faction_fate_system.d.ts.map