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
export declare class MobileUIAdapter {
    private state;
    constructor();
    /**
     * [11] 디바이스 감지 및 UI 모드 전환
     */
    private detectDevice;
    /**
     * [11] 방사형 파이 메뉴 열기
     *
     * 터치 유지/우클릭 시 둥글게 펼쳐지는 퀵 메뉴
     */
    openPieMenu(centerX: number, centerY: number, options: PieMenuOption[]): void;
    /**
     * [11] 하단 슬라이드 퀵 탭 전환
     */
    slideTab(direction: 'left' | 'right'): string;
    getState(): MobileUIState;
    private renderPieItem;
}
//# sourceMappingURL=mobile_ui.d.ts.map