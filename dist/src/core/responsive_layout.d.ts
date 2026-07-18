export type ViewportSize = "desktop" | "tablet" | "mobile";
export interface LayoutConfig {
    readonly sidebarWidth: number;
    readonly topBarHeight: number;
    readonly fontSize: number;
    readonly showMiniMap: boolean;
    readonly showFullLog: boolean;
    readonly columns: number;
    readonly compactMode: boolean;
}
export declare class ResponsiveLayout {
    private currentSize;
    private width;
    private height;
    private readonly configs;
    updateDimensions(width: number, height: number): void;
    getCurrentSize(): ViewportSize;
    getConfig(): LayoutConfig;
    isDesktop(): boolean;
    isTablet(): boolean;
    isMobile(): boolean;
    getContentWidth(): number;
    getContentHeight(): number;
    calculateGridColumns(itemMinWidth: number): number;
    shouldStackPanels(): boolean;
    getFontSize(level: "small" | "normal" | "large" | "title"): number;
}
//# sourceMappingURL=responsive_layout.d.ts.map