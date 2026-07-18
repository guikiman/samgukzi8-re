/**
 * [21] CSS Grid 기반 안전 여백 오토 앵커 시스템
 * [29] 200ms 터치 디바운싱 필터
 *
 * ResponsiveLayoutManager:
 *   - 9-포인트 그리드 앵커 템플릿 (21:9 ~ 모바일 노치)
 *   - safe-area-inset-* CSS 변수 연동
 *   - 드래그 오작동 방지용 200ms 디바운싱
 */
export type ScreenCategory = 'ULTRAWIDE' | 'DESKTOP' | 'TABLET' | 'MOBILE' | 'FOLDABLE';
export interface LayoutAnchor {
    readonly gridColumn: number;
    readonly gridRow: number;
    readonly alignX: 'start' | 'center' | 'end';
    readonly alignY: 'start' | 'center' | 'end';
}
export declare class ResponsiveLayoutManager {
    private category;
    private anchors;
    private lastTouchEnd;
    private lastTouchPos;
    constructor();
    /**
     * [21] 화면 비율 감지
     */
    detectCategory(): ScreenCategory;
    /**
     * [21] 9-포인트 그리드 앵커 구축
     */
    private buildAnchors;
    /**
     * [21] 안전 여백 CSS 계산
     */
    getSafeAreaCSS(): string;
    /**
     * [29] 200ms 마이크로 디바운싱 필터
     * d ≤ 10px 이내의 200ms 미만 이중 탭 → 스크롤로 취급
     */
    filterTouchEvent(x: number, y: number, timestamp: number): boolean;
    getAnchors(): readonly LayoutAnchor[];
    getCategory(): ScreenCategory;
}
//# sourceMappingURL=responsive_layout_manager.d.ts.map