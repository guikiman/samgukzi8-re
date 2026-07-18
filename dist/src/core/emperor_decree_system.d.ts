/**
 * [18] 황제 옹립 시 제후 세력 대상 황실 칙명 통제 스레드
 *
 * EmperorDecreeSystem:
 *   - 황제 소유 세력이 타 제후를 '한나라의 적'으로 선포
 *   - 대상 세력 외교 관계 파괴 + 백성 민심 30 감소
 *   - 군주 의리/도덕성 기반 수락/거부 판정
 */
import type { FactionID, IGameStore } from './types.js';
export type DecreeType = 'DENOUNCE' | 'TRUCE_ORDER' | 'ALLIANCE_BREAK' | 'EMBARGO' | 'MANDATE';
export interface DecreeResult {
    readonly decreeType: DecreeType;
    readonly targetFactionId: FactionID;
    readonly accepted: boolean;
    readonly reputationChange: number;
    readonly moraleEffect: number;
    readonly diplomaticFallout: number;
}
export declare class EmperorDecreeSystem {
    private store;
    constructor(store: IGameStore);
    /**
     * [18] 황실 칙명 발송
     *
     * target의 군주 의리 ≥ 70 → 수락 (동맹 강제 파기)
     * target의 군주 도덕성 ≤ 30 → 거부 (민심 30 감소)
     */
    issueDecree(emperorFactionId: FactionID, targetFactionId: FactionID, decreeType: DecreeType): DecreeResult;
    private forceBreakAlliances;
    private reducePopularSupport;
}
//# sourceMappingURL=emperor_decree_system.d.ts.map