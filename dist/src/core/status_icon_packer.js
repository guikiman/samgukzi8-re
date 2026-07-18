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
const STATUS_ICONS = {
    burning: 0,
    confused: 1,
    poisoned: 2,
    taunted: 3,
    stunned: 4,
    healing: 5,
    fortified: 6,
};
export class StatusIconPacker {
    constructor(iconSize = 16, columns = 8) {
        this.iconSize = iconSize;
        this.columns = columns;
    }
    /**
     * 상태 타입 → UV 좌표 변환
     */
    getUV(type, sheetWidth, sheetHeight) {
        const index = STATUS_ICONS[type];
        const col = index % this.columns;
        const row = Math.floor(index / this.columns);
        return {
            u: (col * this.iconSize) / sheetWidth,
            v: (row * this.iconSize) / sheetHeight,
            w: this.iconSize / sheetWidth,
            h: this.iconSize / sheetHeight,
        };
    }
    /**
     * 모든 아이콘 UV 맵 반환
     */
    getAllUVs(sheetWidth, sheetHeight) {
        const result = {};
        for (const type of Object.keys(STATUS_ICONS)) {
            result[type] = this.getUV(type, sheetWidth, sheetHeight);
        }
        return result;
    }
    /**
     * 아이콘 인덱스 조회
     */
    getIndex(type) {
        return STATUS_ICONS[type];
    }
}
//# sourceMappingURL=status_icon_packer.js.map