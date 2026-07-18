export class HexFoWRenderer {
    constructor() {
        this.fogMap = new Map();
    }
    setFog(q, r, state) {
        this.fogMap.set(`${q},${r}`, state);
    }
    getFog(q, r) {
        return this.fogMap.get(`${q},${r}`) ?? "hidden";
    }
    getFogAlpha(q, r) {
        const state = this.getFog(q, r);
        switch (state) {
            case "visible": return 0;
            case "explored": return 0.35;
            case "hidden": return 0.7;
        }
    }
    clearAll() {
        this.fogMap.clear();
    }
}
//# sourceMappingURL=hex_fow_renderer.js.map