export class HexTooltipSystem {
    constructor() {
        this.tooltipEl = null;
    }
    initialize() {
        const el = document.createElement("div");
        el.style.cssText = `
      position: fixed; pointer-events: none; background: rgba(0,0,0,0.8);
      color: #fff; padding: 8px 12px; border-radius: 4px;
      font-size: 12px; z-index: 1000; display: none;
    `;
        document.body.appendChild(el);
        this.tooltipEl = el;
        return el;
    }
    show(info, screenX, screenY) {
        if (!this.tooltipEl)
            return;
        this.tooltipEl.innerHTML = `
      <div><strong>${info.name}</strong></div>
      <div>지형: ${info.terrain}</div>
      <div>고도: ${info.elevation}</div>
      ${info.owner ? `<div>소유: ${info.owner}</div>` : ""}
      ${info.units !== undefined ? `<div>부대: ${info.units}</div>` : ""}
    `;
        this.tooltipEl.style.display = "block";
        this.tooltipEl.style.left = `${Math.min(screenX + 12, window.innerWidth - 200)}px`;
        this.tooltipEl.style.top = `${Math.min(screenY + 12, window.innerHeight - 100)}px`;
    }
    hide() {
        if (this.tooltipEl) {
            this.tooltipEl.style.display = "none";
        }
    }
}
//# sourceMappingURL=hex_tooltip_system.js.map