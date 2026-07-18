/**
 * [22][23][26][27][28][30] 3D CSS 변환 기반 카드 뒤집기/확대경
 *
 * CardFlipController:
 *   - CSS perspective + rotateY(180deg) 3D 카드 뒤집기
 *   - 마우스 호버 시 1.5x 확대경 효과
 *   - 무장 프로필, 도시 정보, 아이템 카드 등에 사용
 */

export type CardFace = 'FRONT' | 'BACK';

export interface CardFlipConfig {
    readonly duration: number;       // ms
    readonly perspective: number;    // px
    readonly scaleOnHover: number;  // 1.0-2.0
    readonly borderRadius: number;   // px
}

export class CardFlipController {
    private config: CardFlipConfig;
    private currentFace: CardFace = 'FRONT';
    private isFlipping: boolean = false;

    constructor(config?: Partial<CardFlipConfig>) {
        this.config = {
            duration: config?.duration ?? 600,
            perspective: config?.perspective ?? 1000,
            scaleOnHover: config?.scaleOnHover ?? 1.5,
            borderRadius: config?.borderRadius ?? 8,
        };
    }

    /**
     * [22] CSS 3D 카드 뒤집기 스타일 생성
     */
    getCardStyle(face: CardFace): string {
        const rotation = face === 'BACK' ? 'rotateY(180deg)' : 'rotateY(0deg)';
        return `
            perspective: ${this.config.perspective}px;
            transform: ${rotation};
            transition: transform ${this.config.duration}ms ease-in-out;
            backface-visibility: hidden;
            border-radius: ${this.config.borderRadius}px;
        `;
    }

    /**
     * [23] 호버 확대경 효과
     */
    getHoverStyle(): string {
        return `
            transition: transform ${this.config.duration}ms ease;
            transform: scale(${this.config.scaleOnHover});
            cursor: zoom-in;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;
    }

    /**
     * [26] 카드 뒤집기 토글
     */
    flip(): CardFace {
        this.currentFace = this.currentFace === 'FRONT' ? 'BACK' : 'FRONT';
        return this.currentFace;
    }

    getCurrentFace(): CardFace { return this.currentFace; }
    getConfig(): CardFlipConfig { return this.config; }
}
