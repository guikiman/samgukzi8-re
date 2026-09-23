/**
 * 세력 운명 시스템 — 멸망/통일 판정 [213][218]
 *
 * 매월 말 정산 후 호출:
 * 1) 도시 0개 세력 = 멸망 → 소속 무장은 재야(FREE)로 방출
 * 2) 생존 세력 1개 = 통일 → 엔딩 판정 (플레이어 세력이면 승리, 아니면 패배)
 */
import type { GameStore } from './game_store.js';
export type GameEnding = 'PLAYER_UNIFICATION' | 'AI_UNIFICATION' | null;
export interface VagrantConversionInfo {
    factionId: string;
    factionName: string;
    keptOfficers: number;
    releasedOfficers: number;
    message: string;
}
export interface FactionFateReport {
    destroyedFactionIds: string[];
    destroyedFactionNames: string[];
    ending: GameEnding;
    winnerFactionName: string | null;
    /** 플레이어 세력이 이번 판정에서 멸망했는가 — [213] playerFactionId 정합성 */
    playerFactionDestroyed?: boolean;
    /** 멸망 시 패배 안내 메시지 */
    playerDefeatMessage?: string;
    /** [83] 이번 판정에서 방랑군으로 전환된 세력 (멸망 제외) */
    vagrantConversions?: VagrantConversionInfo[];
}
export declare class FactionFateSystem {
    private store;
    constructor(store: GameStore);
    /** 멸망 판정 + 통일 확인 — 월말 정산 후 호출 */
    checkFates(): FactionFateReport;
    /**
     * 멸망 판정 + 통일 확인 — 방랑군 재기 옵션 [83][213]
     * @param reviveAsVagrant true면 도시 0개 세력을 제거하지 않고 방랑군으로 전환.
     *        단, 세력이 도시를 잃고 무장까지 0명이면(재기 불가) 기존대로 제거한다.
     *        플레이어 세력은 무장이 남아 있는 한 항상 방랑군으로 생존.
     */
    checkFatesWithVagrantRevival(reviveAsVagrant: boolean): FactionFateReport;
}
//# sourceMappingURL=faction_fate_system.d.ts.map