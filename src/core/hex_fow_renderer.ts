export type FogState = "visible" | "explored" | "hidden";

export class HexFoWRenderer {
  private fogMap = new Map<string, FogState>();

  setFog(q: number, r: number, state: FogState): void {
    this.fogMap.set(`${q},${r}`, state);
  }

  getFog(q: number, r: number): FogState {
    return this.fogMap.get(`${q},${r}`) ?? "hidden";
  }

  getFogAlpha(q: number, r: number): number {
    const state = this.getFog(q, r);
    switch (state) {
      case "visible": return 0;
      case "explored": return 0.35;
      case "hidden": return 0.7;
    }
  }

  clearAll(): void {
    this.fogMap.clear();
  }
}
