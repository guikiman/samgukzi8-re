export type ClickType = "left" | "right" | "double";

export interface HexClickEvent {
  readonly q: number;
  readonly r: number;
  readonly type: ClickType;
  readonly screenX: number;
  readonly screenY: number;
}

export class HexClickHandler {
  private listeners = new Map<string, (event: HexClickEvent) => void>();

  screenToHex(screenX: number, screenY: number, hexSize: number, offsetX: number, offsetY: number): { q: number; r: number } {
    const x = (screenX - offsetX) / (hexSize * 1.5);
    const y = (screenY - offsetY) / (hexSize * Math.sqrt(3));
    const q = Math.round(x - y * 0.5);
    const r = Math.round(y);
    return { q, r };
  }

  onTileClick(q: number, r: number, handler: (event: HexClickEvent) => void): void {
    this.listeners.set(`${q},${r}`, handler);
  }

  handleClick(event: HexClickEvent): void {
    const key = `${event.q},${event.r}`;
    const handler = this.listeners.get(key);
    if (handler) handler(event);
  }
}
