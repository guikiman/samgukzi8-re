/**
 * [11] 모바일 화면 최적화 '한 손 터치 슬라이드 퀵 메뉴'
 *
 * MobileUIAdapter:
 *   - 방사형 파이(Pie) 메뉴: 마우스 우클릭/터치 유지 시 둥글게 펼쳐짐
 *   - 하단 슬라이드 탭: 내정/인사 탭 초고속 스왑
 *   - 동적 레이아웃 제어: 화면 크기 감지 및 UI 모드 전환
 */

export type UIMode = 'DESKTOP' | 'MOBILE';

export interface PieMenuOption {
    readonly id: string;
    readonly label: string;
    readonly icon: string;
    readonly action: () => void;
}

export interface MobileUIState {
    readonly mode: UIMode;
    readonly isPieMenuOpen: boolean;
    readonly activeSlideTab: string;
    readonly isTouchDevice: boolean;
}

export class MobileUIAdapter {
    private state: MobileUIState = {
        mode: 'DESKTOP',
        isPieMenuOpen: false,
        activeSlideTab: 'domestic',
        isTouchDevice: false,
    };

    constructor() {
        this.detectDevice();
    }

    /**
     * [11] 디바이스 감지 및 UI 모드 전환
     */
    private detectDevice(): void {
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.state = {
            ...this.state,
            mode: isTouch ? 'MOBILE' : 'DESKTOP',
            isTouchDevice: isTouch,
        };
    }

    /**
     * [11] 방사형 파이 메뉴 열기
     *
     * 터치 유지/우클릭 시 둥글게 펼쳐지는 퀵 메뉴
     */
    openPieMenu(centerX: number, centerY: number, options: PieMenuOption[]): void {
        this.state = { ...this.state, isPieMenuOpen: true };
        const radius = 60;
        const angleStep = (2 * Math.PI) / options.length;

        options.forEach((opt, i) => {
            const angle = angleStep * i - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.renderPieItem(x, y, opt);
        });
    }

    /**
     * [11] 하단 슬라이드 퀵 탭 전환
     */
    slideTab(direction: 'left' | 'right'): string {
        const tabs = ['domestic', 'personnel', 'military', 'diplomacy', 'strategy'];
        const currentIdx = tabs.indexOf(this.state.activeSlideTab);
        const nextIdx = direction === 'left'
            ? (currentIdx - 1 + tabs.length) % tabs.length
            : (currentIdx + 1) % tabs.length;
        this.state = { ...this.state, activeSlideTab: tabs[nextIdx] };
        return tabs[nextIdx];
    }

    getState(): MobileUIState { return this.state; }

    private renderPieItem(x: number, y: number, opt: PieMenuOption): void {
        // DOM 렌더링 — 실제 구현 시 DOM 조작
        console.log(`[PieMenu] ${opt.label} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
}
