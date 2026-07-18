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

export class VirtualScrollManager {
  private itemHeight: number;
  private overscan: number;
  private totalItems: number;
  private containerHeight: number;
  private scrollTop = 0;

  constructor(options: VirtualScrollOptions) {
    this.itemHeight = options.itemHeight;
    this.overscan = options.overscan;
    this.totalItems = options.totalItems;
    this.containerHeight = options.containerHeight;
  }

  updateTotalItems(count: number): void {
    this.totalItems = count;
  }

  updateContainerHeight(height: number): void {
    this.containerHeight = height;
  }

  onScroll(scrollTop: number): void {
    this.scrollTop = Math.max(0, scrollTop);
  }

  getVisibleRange(): VisibleRange {
    const start = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.overscan);
    const end = Math.min(this.totalItems, Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.overscan);
    return {
      start,
      end,
      offsetY: start * this.itemHeight,
      visibleCount: end - start,
    };
  }

  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }

  scrollToItem(index: number): void {
    this.scrollTop = index * this.itemHeight;
  }

  getItemOffset(index: number): number {
    return index * this.itemHeight;
  }

  isItemVisible(index: number): boolean {
    const range = this.getVisibleRange();
    return index >= range.start && index < range.end;
  }
}

export class OfficerVirtualScroll {
  private scroll = new VirtualScrollManager({
    itemHeight: 48,
    overscan: 10,
    totalItems: 0,
    containerHeight: 600,
  });

  private filteredOfficers: Array<{ id: string; name: string; display: string }> = [];

  setOfficers(officers: Array<{ id: string; name: string; stats: Record<string, number> }>): void {
    this.filteredOfficers = officers.map((o) => ({
      id: o.id,
      name: o.name,
      display: `${o.name} (통솔:${o.stats.leadership ?? 0} 무력:${o.stats.might ?? 0} 지력:${o.stats.intelligence ?? 0})`,
    }));
    this.scroll.updateTotalItems(this.filteredOfficers.length);
  }

  onContainerResize(height: number): void {
    this.scroll.updateContainerHeight(height);
  }

  onScroll(scrollTop: number): void {
    this.scroll.onScroll(scrollTop);
  }

  getVisibleOfficers(): Array<{ index: number; data: { id: string; name: string; display: string } }> {
    const range = this.scroll.getVisibleRange();
    const result: Array<{ index: number; data: { id: string; name: string; display: string } }> = [];
    for (let i = range.start; i < range.end && i < this.filteredOfficers.length; i++) {
      result.push({ index: i, data: this.filteredOfficers[i] });
    }
    return result;
  }

  getTotalHeight(): number {
    return this.scroll.getTotalHeight();
  }
}