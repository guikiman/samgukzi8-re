export class VirtualScrollManager {
    constructor(options) {
        this.scrollTop = 0;
        this.itemHeight = options.itemHeight;
        this.overscan = options.overscan;
        this.totalItems = options.totalItems;
        this.containerHeight = options.containerHeight;
    }
    updateTotalItems(count) {
        this.totalItems = count;
    }
    updateContainerHeight(height) {
        this.containerHeight = height;
    }
    onScroll(scrollTop) {
        this.scrollTop = Math.max(0, scrollTop);
    }
    getVisibleRange() {
        const start = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan);
        const end = Math.min(this.totalItems, Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.overscan);
        return {
            start,
            end,
            offsetY: start * this.itemHeight,
            visibleCount: end - start,
        };
    }
    getTotalHeight() {
        return this.totalItems * this.itemHeight;
    }
    scrollToItem(index) {
        this.scrollTop = index * this.itemHeight;
    }
    getItemOffset(index) {
        return index * this.itemHeight;
    }
    isItemVisible(index) {
        const range = this.getVisibleRange();
        return index >= range.start && index < range.end;
    }
}
export class OfficerVirtualScroll {
    constructor() {
        this.scroll = new VirtualScrollManager({
            itemHeight: 48,
            overscan: 10,
            totalItems: 0,
            containerHeight: 600,
        });
        this.filteredOfficers = [];
    }
    setOfficers(officers) {
        this.filteredOfficers = officers.map((o) => ({
            id: o.id,
            name: o.name,
            display: `${o.name} (통솔:${o.stats.leadership ?? 0} 무력:${o.stats.might ?? 0} 지력:${o.stats.intelligence ?? 0})`,
        }));
        this.scroll.updateTotalItems(this.filteredOfficers.length);
    }
    onContainerResize(height) {
        this.scroll.updateContainerHeight(height);
    }
    onScroll(scrollTop) {
        this.scroll.onScroll(scrollTop);
    }
    getVisibleOfficers() {
        const range = this.scroll.getVisibleRange();
        const result = [];
        for (let i = range.start; i < range.end && i < this.filteredOfficers.length; i++) {
            result.push({ index: i, data: this.filteredOfficers[i] });
        }
        return result;
    }
    getTotalHeight() {
        return this.scroll.getTotalHeight();
    }
}
//# sourceMappingURL=virtual_scroll_manager.js.map