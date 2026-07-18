export interface ViewportRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export class HexGridOptimizer {
  getVisibleTiles(viewport: ViewportRect, hexSize: number): { q: number; r: number }[] {
    const tiles: { q: number; r: number }[] = [];
    const hexW = hexSize * 2;
    const hexH = hexSize * Math.sqrt(3);
    const startQ = Math.floor(viewport.x / (hexW * 0.75)) - 1;
    const endQ = Math.ceil((viewport.x + viewport.w) / (hexW * 0.75)) + 1;
    const startR = Math.floor(viewport.y / hexH) - 1;
    const endR = Math.ceil((viewport.y + viewport.h) / hexH) + 1;

    for (let r = startR; r <= endR; r++) {
      for (let q = startQ; q <= endQ; q++) {
        const x = (q + r * 0.5) * hexW * 0.75;
        const y = r * hexH * 0.866;
        if (x + hexSize > viewport.x && x - hexSize < viewport.x + viewport.w && y + hexSize > viewport.y && y - hexSize < viewport.y + viewport.h) {
          tiles.push({ q, r });
        }
      }
    }
    return tiles;
  }

  getLODLevel(distance: number): number {
    if (distance < 10) return 0;
    if (distance < 30) return 1;
    if (distance < 60) return 2;
    return 3;
  }
}
