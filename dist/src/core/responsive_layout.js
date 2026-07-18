export class ResponsiveLayout {
    constructor() {
        this.currentSize = "desktop";
        this.width = 1920;
        this.height = 1080;
        this.configs = {
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
    }
    updateDimensions(width, height) {
        this.width = width;
        this.height = height;
        if (width >= 1024)
            this.currentSize = "desktop";
        else if (width >= 640)
            this.currentSize = "tablet";
        else
            this.currentSize = "mobile";
    }
    getCurrentSize() {
        return this.currentSize;
    }
    getConfig() {
        return { ...this.configs[this.currentSize] };
    }
    isDesktop() {
        return this.currentSize === "desktop";
    }
    isTablet() {
        return this.currentSize === "tablet";
    }
    isMobile() {
        return this.currentSize === "mobile";
    }
    getContentWidth() {
        const config = this.getConfig();
        return this.width - config.sidebarWidth;
    }
    getContentHeight() {
        return this.height - this.getConfig().topBarHeight;
    }
    calculateGridColumns(itemMinWidth) {
        const contentWidth = this.getContentWidth();
        return Math.max(1, Math.floor(contentWidth / itemMinWidth));
    }
    shouldStackPanels() {
        return this.width < 768;
    }
    getFontSize(level) {
        const base = this.getConfig().fontSize;
        const sizes = { small: base - 2, normal: base, large: base + 4, title: base + 10 };
        return sizes[level];
    }
}
//# sourceMappingURL=responsive_layout.js.map