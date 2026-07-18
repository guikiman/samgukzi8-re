export type HexDirection = "NE" | "E" | "SE" | "SW" | "W" | "NW";

const DIRECTION_DELTAS: Record<HexDirection, { dq: number; dr: number }> = {
  NE: { dq: 1, dr: -1 },
  E: { dq: 1, dr: 0 },
  SE: { dq: 0, dr: 1 },
  SW: { dq: -1, dr: 1 },
  W: { dq: -1, dr: 0 },
  NW: { dq: 0, dr: -1 },
};

export class HexKeyboardNav {
  private cursorQ = 0;
  private cursorR = 0;

  moveCursor(direction: HexDirection): void {
    const delta = DIRECTION_DELTAS[direction];
    this.cursorQ += delta.dq;
    this.cursorR += delta.dr;
  }

  setCursor(q: number, r: number): void {
    this.cursorQ = q;
    this.cursorR = r;
  }

  get q(): number {
    return this.cursorQ;
  }

  get r(): number {
    return this.cursorR;
  }
}
