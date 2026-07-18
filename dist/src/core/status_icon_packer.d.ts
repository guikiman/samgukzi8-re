/**
 * [Task 74] 상태 아이콘 패커 — StatusIconPacker
 *
 * 목적: 상태 이상 아이콘(불, 혼란, 독 등)을
 *       아틀라스에 패킹하여 아이콘별 UV 좌표 관리.
 *
 * 핵심 로직:
 *   1. 고정 크기 아이콘 시트 (16x16)
 *   2. 아이콘 타입별 인덱스 매핑
 */
export type StatusType = "burning" | "confused" | "poisoned" | "taunted" | "stunned" | "healing" | "fortified";
export declare class StatusIconPacker {
    private readonly iconSize;
    private readonly columns;
    constructor(iconSize?: number, columns?: number);
    /**
     * 상태 타입 → UV 좌표 변환
     */
    getUV(type: StatusType, sheetWidth: number, sheetHeight: number): {
        u: number;
        v: number;
        w: number;
        h: number;
    };
    /**
     * 모든 아이콘 UV 맵 반환
     */
    getAllUVs(sheetWidth: number, sheetHeight: number): Record<StatusType, {
        u: number;
        v: number;
        w: number;
        h: number;
    }>;
    /**
     * 아이콘 인덱스 조회
     */
    getIndex(type: StatusType): number;
}
//# sourceMappingURL=status_icon_packer.d.ts.map