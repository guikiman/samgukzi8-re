export class HexClickHandler {
    constructor() {
        this.listeners = new Map();
    }
    screenToHex(screenX, screenY, hexSize, offsetX, offsetY) {
        const x = (screenX - offsetX) / (hexSize * 1.5);
        const y = (screenY - offsetY) / (hexSize * Math.sqrt(3));
        const q = Math.round(x - y * 0.5);
        const r = Math.round(y);
        return { q, r };
    }
    onTileClick(q, r, handler) {
        this.listeners.set(`${q},${r}`, handler);
    }
    handleClick(event) {
        const key = `${event.q},${event.r}`;
        const handler = this.listeners.get(key);
        if (handler)
            handler(event);
    }
}
//# sourceMappingURL=hex_click_handler.js.map