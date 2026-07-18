/**
 * [Task 69] 스프라이트 시트 얼라이너 — SpriteSheetAligner
 *
 * 목적: 개별 스프라이트를 아틀라스 시트에 균일한
 *       그리드로 정렬하여 배치.
 *
 * 핵심 로직:
 *   1. 고정 그리드 크기 기반 배치 (NxM)
 *   2. 프레임 인덱스 → UV 좌표 변환
 */
export interface SpriteFrame {
    readonly index: number;
    readonly u: number;
    readonly v: number;
    readonly w: number;
    readonly h: number;
}
export declare class SpriteSheetAligner {
    private readonly columns;
    private readonly rows;
    private readonly frameWidth;
    private readonly frameHeight;
    private readonly totalFrames;
    constructor(columns: number, rows: number, frameWidth: number, frameHeight: number);
    /**
     * 프레임 인덱스를 UV 좌표로 변환
     */
    getFrame(index: number, sheetWidth: number, sheetHeight: number): SpriteFrame | null;
    /**
     * 모든 프레임 UV 좌표 반환
     */
    getAllFrames(sheetWidth: number, sheetHeight: number): SpriteFrame[];
    /**
     * 시트 내 최대 프레임 수
     */
    get capacity(): number;
}
//# sourceMappingURL=sprite_sheet_aligner.d.ts.map