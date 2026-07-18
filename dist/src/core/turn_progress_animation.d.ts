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
export declare class TurnProgressAnimation {
    private pendingId;
    private events;
    private activeAnimations;
    private frameId;
    private onRender;
    setRenderCallback(cb: (events: Array<{
        id: string;
        state: AnimationState;
        event: AnimationEvent;
    }>) => void): void;
    private nextId;
    addEvent(event: AnimationEvent): string;
    addBatchEvents(events: AnimationEvent[]): void;
    private startAnimation;
    getEventColor(type: AnimationType): string;
    getEventSymbol(type: AnimationType): string;
    stop(): void;
}
//# sourceMappingURL=turn_progress_animation.d.ts.map