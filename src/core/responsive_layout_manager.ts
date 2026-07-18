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

export class ResponsiveLayoutManager {
    private category: ScreenCategory = 'DESKTOP';
    private anchors: LayoutAnchor[] = [];
    private lastTouchEnd: number = 0;
    private lastTouchPos: { x: number; y: number } = { x: 0, y: 0 };

    constructor() {
        this.detectCategory();
        this.buildAnchors();
    }

    /**
     * [21] 화면 비율 감지
     */
    detectCategory(): ScreenCategory {
        if (typeof window === 'undefined') return 'DESKTOP';
        const ratio = window.innerWidth / window.innerHeight;
        if (ratio >= 2.3) this.category = 'ULTRAWIDE';
        else if (ratio >= 1.3) this.category = 'DESKTOP';
        else if (ratio >= 0.75) this.category = 'TABLET';
        else if (ratio >= 0.5) this.category = 'MOBILE';
        else this.category = 'FOLDABLE';
        return this.category;
    }

    /**
     * [21] 9-포인트 그리드 앵커 구축
     */
    private buildAnchors(): void {
        this.anchors = [
            { gridColumn: 1, gridRow: 1, alignX: 'start', alignY: 'start' },
            { gridColumn: 2, gridRow: 1, alignX: 'center', alignY: 'start' },
            { gridColumn: 3, gridRow: 1, alignX: 'end', alignY: 'start' },
            { gridColumn: 1, gridRow: 2, alignX: 'start', alignY: 'center' },
            { gridColumn: 2, gridRow: 2, alignX: 'center', alignY: 'center' },
            { gridColumn: 3, gridRow: 2, alignX: 'end', alignY: 'center' },
            { gridColumn: 1, gridRow: 3, alignX: 'start', alignY: 'end' },
            { gridColumn: 2, gridRow: 3, alignX: 'center', alignY: 'end' },
            { gridColumn: 3, gridRow: 3, alignX: 'end', alignY: 'end' },
        ];
    }

    /**
     * [21] 안전 여백 CSS 계산
     */
    getSafeAreaCSS(): string {
        const insets = {
            top: 'env(safe-area-inset-top, 0px)',
            right: 'env(safe-area-inset-right, 0px)',
            bottom: 'env(safe-area-inset-bottom, 0px)',
            left: 'env(safe-area-inset-left, 0px)',
        };
        return `
            padding-top: ${insets.top};
            padding-right: ${insets.right};
            padding-bottom: ${insets.bottom};
            padding-left: ${insets.left};
        `;
    }

    /**
     * [29] 200ms 마이크로 디바운싱 필터
     * d ≤ 10px 이내의 200ms 미만 이중 탭 → 스크롤로 취급
     */
    filterTouchEvent(x: number, y: number, timestamp: number): boolean {
        const dx = x - this.lastTouchPos.x;
        const dy = y - this.lastTouchPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const timeDiff = timestamp - this.lastTouchEnd;

        this.lastTouchEnd = timestamp;
        this.lastTouchPos = { x, y };

        // 200ms 미만 + 10px 이내 → 오인식, 필터링
        if (timeDiff < 200 && dist <= 10) return false;

        return true; // 유효한 터치
    }

    getAnchors(): readonly LayoutAnchor[] { return this.anchors; }
    getCategory(): ScreenCategory { return this.category; }
}
