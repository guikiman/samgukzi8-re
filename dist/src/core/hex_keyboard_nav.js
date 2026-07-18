const DIRECTION_DELTAS = {
    NE: { dq: 1, dr: -1 },
    E: { dq: 1, dr: 0 },
    SE: { dq: 0, dr: 1 },
    SW: { dq: -1, dr: 1 },
    W: { dq: -1, dr: 0 },
    NW: { dq: 0, dr: -1 },
};
export class HexKeyboardNav {
    constructor() {
        this.cursorQ = 0;
        this.cursorR = 0;
    }
    moveCursor(direction) {
        const delta = DIRECTION_DELTAS[direction];
        this.cursorQ += delta.dq;
        this.cursorR += delta.dr;
    }
    setCursor(q, r) {
        this.cursorQ = q;
        this.cursorR = r;
    }
    get q() {
        return this.cursorQ;
    }
    get r() {
        return this.cursorR;
    }
}
//# sourceMappingURL=hex_keyboard_nav.js.map