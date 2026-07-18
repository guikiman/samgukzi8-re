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

export class ResponsiveLayout {
  private currentSize: ViewportSize = "desktop";
  private width = 1920;
  private height = 1080;

  private readonly configs: Record<ViewportSize, LayoutConfig> = {
    desktop: {
      sidebarWidth: 280, topBarHeight: 48, fontSize: 14,
      showMiniMap: true, showFullLog: true, columns: 3, compactMode: false,
    },
    tablet: {
      sidebarWidth: 200, topBarHeight: 44, fontSize: 13,
      showMiniMap: true, showFullLog: false, columns: 2, compactMode: true,
    },
    mobile: {
      sidebarWidth: 0, topBarHeight: 40, fontSize: 12,
      showMiniMap: false, showFullLog: false, columns: 1, compactMode: true,
    },
  };

  updateDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (width >= 1024) this.currentSize = "desktop";
    else if (width >= 640) this.currentSize = "tablet";
    else this.currentSize = "mobile";
  }

  getCurrentSize(): ViewportSize {
    return this.currentSize;
  }

  getConfig(): LayoutConfig {
    return { ...this.configs[this.currentSize] };
  }

  isDesktop(): boolean {
    return this.currentSize === "desktop";
  }

  isTablet(): boolean {
    return this.currentSize === "tablet";
  }

  isMobile(): boolean {
    return this.currentSize === "mobile";
  }

  getContentWidth(): number {
    const config = this.getConfig();
    return this.width - config.sidebarWidth;
  }

  getContentHeight(): number {
    return this.height - this.getConfig().topBarHeight;
  }

  calculateGridColumns(itemMinWidth: number): number {
    const contentWidth = this.getContentWidth();
    return Math.max(1, Math.floor(contentWidth / itemMinWidth));
  }

  shouldStackPanels(): boolean {
    return this.width < 768;
  }

  getFontSize(level: "small" | "normal" | "large" | "title"): number {
    const base = this.getConfig().fontSize;
    const sizes = { small: base - 2, normal: base, large: base + 4, title: base + 10 };
    return sizes[level];
  }
}