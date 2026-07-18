export class TurnProgressAnimation {
    constructor() {
        this.pendingId = 0;
        this.events = new Map();
        this.activeAnimations = new Map();
        this.frameId = null;
        this.onRender = null;
    }
    setRenderCallback(cb) {
        this.onRender = cb;
    }
    nextId() {
        this.pendingId++;
        return `anim_${Date.now()}_${this.pendingId}`;
    }
    addEvent(event) {
        const id = this.nextId();
        this.events.set(id, event);
        this.activeAnimations.set(id, {
            progress: 0,
            currentX: event.fromX,
            currentY: event.fromY,
            alpha: 1,
            finished: false,
        });
        this.startAnimation();
        return id;
    }
    addBatchEvents(events) {
        for (const event of events) {
            const id = this.nextId();
            this.events.set(id, event);
            this.activeAnimations.set(id, {
                progress: 0,
                currentX: event.fromX,
                currentY: event.fromY,
                alpha: 1,
                finished: false,
            });
        }
        this.startAnimation();
    }
    startAnimation() {
        if (this.frameId !== null)
            return;
        const animate = () => {
            let allDone = true;
            const renderData = [];
            for (const [id, state] of this.activeAnimations) {
                if (state.finished)
                    continue;
                state.progress += 0.02;
                if (state.progress >= 1) {
                    state.finished = true;
                    state.alpha = 0;
                }
                else {
                    const event = this.events.get(id);
                    if (event) {
                        state.currentX = event.fromX + (event.toX - event.fromX) * state.progress;
                        state.currentY = event.fromY + (event.toY - event.fromY) * state.progress;
                        state.alpha = state.progress < 0.8 ? 1 : 1 - (state.progress - 0.8) / 0.2;
                    }
                }
                allDone = false;
                renderData.push({ id, state, event: this.events.get(id) });
            }
            this.onRender?.(renderData);
            if (!allDone) {
                this.frameId = requestAnimationFrame(animate);
            }
            else {
                this.frameId = null;
                this.events.clear();
                this.activeAnimations.clear();
            }
        };
        this.frameId = requestAnimationFrame(animate);
    }
    getEventColor(type) {
        const colors = {
            march: "#e74c3c", battle: "#c0392b", trade: "#27ae60",
            diplomacy: "#3498db", construction: "#f39c12",
        };
        return colors[type] ?? "#95a5a6";
    }
    getEventSymbol(type) {
        const symbols = {
            march: "⚔", battle: "💥", trade: "💰", diplomacy: "🤝", construction: "🔨",
        };
        return symbols[type] ?? "•";
    }
    stop() {
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        this.events.clear();
        this.activeAnimations.clear();
    }
}
//# sourceMappingURL=turn_progress_animation.js.map