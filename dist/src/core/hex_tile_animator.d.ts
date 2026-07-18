/**
 * [Task 81] 헥스 타일 애니메이터 — HexTileAnimator
 *
 * 목적: 헥스 타일의 선택, 호버, 이동 가능 표시 등
 *       상태별 시각적 애니메이션 처리.
 *
 * 핵심 로직:
 *   1. 타일 상태별 애니메이션 (선택/호버/이동가능/공격가능)
 *   2. 페이드 인/아웃, 깜빡임, 색상 전환
 */
export type TileAnimState = "idle" | "hover" | "selected" | "movable" | "attackable" | "healable";
export interface TileAnimConfig {
    readonly state: TileAnimState;
    readonly duration: number;
    readonly color: [number, number, number, number];
    readonly pulse: boolean;
}
export declare class HexTileAnimator {
    private animTime;
    private activeTiles;
    private static readonly CONFIGS;
    /**
     * 타임 업데이트
     */
    update(dt: number): void;
    /**
     * 타일 상태 설정
     */
    setState(tileId: string, state: TileAnimState): void;
    /**
     * 타일 상태 제거
     */
    removeState(tileId: string): void;
    /**
     * 특정 타일의 현재 애니메이션 색상 계산
     */
    getColor(tileId: string): [number, number, number, number];
    /**
     * 모든 활성 타일 상태 초기화
     */
    clearAll(): void;
}
//# sourceMappingURL=hex_tile_animator.d.ts.map