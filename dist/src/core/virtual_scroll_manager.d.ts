export interface VirtualScrollOptions {
    itemHeight: number;
    overscan: number;
    totalItems: number;
    containerHeight: number;
}
export interface VisibleRange {
    start: number;
    end: number;
    offsetY: number;
    visibleCount: number;
}
export declare class VirtualScrollManager {
    private itemHeight;
    private overscan;
    private totalItems;
    private containerHeight;
    private scrollTop;
    constructor(options: VirtualScrollOptions);
    updateTotalItems(count: number): void;
    updateContainerHeight(height: number): void;
    onScroll(scrollTop: number): void;
    getVisibleRange(): VisibleRange;
    getTotalHeight(): number;
    scrollToItem(index: number): void;
    getItemOffset(index: number): number;
    isItemVisible(index: number): boolean;
}
export declare class OfficerVirtualScroll {
    private scroll;
    private filteredOfficers;
    setOfficers(officers: Array<{
        id: string;
        name: string;
        stats: Record<string, number>;
    }>): void;
    onContainerResize(height: number): void;
    onScroll(scrollTop: number): void;
    getVisibleOfficers(): Array<{
        index: number;
        data: {
            id: string;
            name: string;
            display: string;
        };
    }>;
    getTotalHeight(): number;
}
//# sourceMappingURL=virtual_scroll_manager.d.ts.map