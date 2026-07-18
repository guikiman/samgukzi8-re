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
export class SpriteSheetAligner {
    constructor(columns, rows, frameWidth, frameHeight) {
        this.columns = columns;
        this.rows = rows;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.totalFrames = columns * rows;
    }
    /**
     * 프레임 인덱스를 UV 좌표로 변환
     */
    getFrame(index, sheetWidth, sheetHeight) {
        if (index < 0 || index >= this.totalFrames)
            return null;
        const col = index % this.columns;
        const row = Math.floor(index / this.columns);
        return {
            index,
            u: (col * this.frameWidth) / sheetWidth,
            v: (row * this.frameHeight) / sheetHeight,
            w: this.frameWidth / sheetWidth,
            h: this.frameHeight / sheetHeight,
        };
    }
    /**
     * 모든 프레임 UV 좌표 반환
     */
    getAllFrames(sheetWidth, sheetHeight) {
        const frames = [];
        for (let i = 0; i < this.totalFrames; i++) {
            const frame = this.getFrame(i, sheetWidth, sheetHeight);
            if (frame)
                frames.push(frame);
        }
        return frames;
    }
    /**
     * 시트 내 최대 프레임 수
     */
    get capacity() {
        return this.totalFrames;
    }
}
//# sourceMappingURL=sprite_sheet_aligner.js.map