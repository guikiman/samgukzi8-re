/**
 * [B12] 포위망 및 ZOC 차단 시스템 — FlankingZOCRestriction
 *
 * 목적: 헥사곤 타일 상에서 적 부대의 통제 영역(Zone of Control) 및
 *       다각도 포위 상태 판정.
 *
 * 핵심 로직:
 *   1. 적 부대 인접 6방향 타일 → ZOC 설정 (일반 통과 차단)
 *   2. 아군 2개 이상 부대가 적을 샌드위치 → 측방/후방 데미지 1.2~1.5배
 */
export interface HexCoord {
    readonly q: number;
    readonly r: number;
}
export interface ZOCState {
    readonly unitId: string;
    readonly zocTiles: string[];
    readonly flankRatio: number;
}
export interface FlankingResult {
    readonly flankingBonus: number;
    readonly attackerCount: number;
    readonly isPincer: boolean;
    readonly isSurrounded: boolean;
}
export declare class FlankingZOCRestriction {
    /** 특정 부대의 ZOC 타일 목록 계산 */
    getZOCTiles(q: number, r: number): string[];
    /** 해당 타일이 ZOC(통제 영역)에 속하는지 확인 */
    isInZOC(tileKey: string, enemyPositions: HexCoord[]): boolean;
    /**
     * 포위 상태 판정
     *
     * @param targetQ     - 대상 부대 q 좌표
     * @param targetR     - 대상 부대 r 좌표
     * @param allyPositions - 아군 부대 위치 목록
     */
    evaluateFlanking(targetQ: number, targetR: number, allyPositions: HexCoord[]): FlankingResult;
    /** ZOC로 인한 강제 정지 여부 판정 (ZOC 타일 통과 시도 시) */
    isBlockedByZOC(fromQ: number, fromR: number, toQ: number, toR: number, enemyPositions: HexCoord[]): boolean;
}
//# sourceMappingURL=flanking_zoc_restriction.d.ts.map