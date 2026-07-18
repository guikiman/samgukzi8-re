export type AnimationType = "march" | "battle" | "trade" | "diplomacy" | "construction";

export interface AnimationEvent {
  readonly type: AnimationType;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  readonly label: string;
  readonly duration: number;
  readonly color: string;
}

export interface AnimationState {
  progress: number;
  currentX: number;
  currentY: number;
  alpha: number;
  finished: boolean;
}

export class TurnProgressAnimation {
  private pendingId = 0;
  private events: Map<string, AnimationEvent> = new Map();
  private activeAnimations: Map<string, AnimationState> = new Map();
  private frameId: number | null = null;
  private onRender: ((events: Array<{ id: string; state: AnimationState; event: AnimationEvent }>) => void) | null = null;

  setRenderCallback(
    cb: (events: Array<{ id: string; state: AnimationState; event: AnimationEvent }>) => void,
  ): void {
    this.onRender = cb;
  }

  private nextId(): string {
    this.pendingId++;
    return `anim_${Date.now()}_${this.pendingId}`;
  }

  addEvent(event: AnimationEvent): string {
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

  addBatchEvents(events: AnimationEvent[]): void {
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

  private startAnimation(): void {
    if (this.frameId !== null) return;
    const animate = () => {
      let allDone = true;
      const renderData: Array<{ id: string; state: AnimationState; event: AnimationEvent }> = [];

      for (const [id, state] of this.activeAnimations) {
        if (state.finished) continue;
        state.progress += 0.02;
        if (state.progress >= 1) {
          state.finished = true;
          state.alpha = 0;
        } else {
          const event = this.events.get(id);
          if (event) {
            state.currentX = event.fromX + (event.toX - event.fromX) * state.progress;
            state.currentY = event.fromY + (event.toY - event.fromY) * state.progress;
            state.alpha = state.progress < 0.8 ? 1 : 1 - (state.progress - 0.8) / 0.2;
          }
        }
        allDone = false;
        renderData.push({ id, state, event: this.events.get(id)! });
      }

      this.onRender?.(renderData);

      if (!allDone) {
        this.frameId = requestAnimationFrame(animate);
      } else {
        this.frameId = null;
        this.events.clear();
        this.activeAnimations.clear();
      }
    };

    this.frameId = requestAnimationFrame(animate);
  }

  getEventColor(type: AnimationType): string {
    const colors: Record<AnimationType, string> = {
      march: "#e74c3c", battle: "#c0392b", trade: "#27ae60",
      diplomacy: "#3498db", construction: "#f39c12",
    };
    return colors[type] ?? "#95a5a6";
  }

  getEventSymbol(type: AnimationType): string {
    const symbols: Record<AnimationType, string> = {
      march: "⚔", battle: "💥", trade: "💰", diplomacy: "🤝", construction: "🔨",
    };
    return symbols[type] ?? "•";
  }

  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.events.clear();
    this.activeAnimations.clear();
  }
}