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
    readonly duration: number;
    readonly perspective: number;
    readonly scaleOnHover: number;
    readonly borderRadius: number;
}
export declare class CardFlipController {
    private config;
    private currentFace;
    private isFlipping;
    constructor(config?: Partial<CardFlipConfig>);
    /**
     * [22] CSS 3D 카드 뒤집기 스타일 생성
     */
    getCardStyle(face: CardFace): string;
    /**
     * [23] 호버 확대경 효과
     */
    getHoverStyle(): string;
    /**
     * [26] 카드 뒤집기 토글
     */
    flip(): CardFace;
    getCurrentFace(): CardFace;
    getConfig(): CardFlipConfig;
}
//# sourceMappingURL=card_flip_magnifier.d.ts.map