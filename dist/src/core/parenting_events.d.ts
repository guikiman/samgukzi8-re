import type { ChildGenome } from "./child_genetics";
export interface ParentingEvent {
    readonly childId: string;
    readonly childName: string;
    readonly childAge: number;
    readonly type: "illness" | "rebellion" | "genius_awakening" | "accident" | "friendship" | "rivalry";
    readonly description: string;
    readonly statEffects: Partial<ChildGenome>;
}
export declare class ParentingEvents {
    generateEvent(childId: string, childName: string, age: number): ParentingEvent | null;
    private generateIllness;
    private generateRebellion;
    private generateGeniusAwakening;
    private generateAccident;
    private generateFriendship;
    private generateRivalry;
    applyEffects(genome: ChildGenome, event: ParentingEvent): ChildGenome;
}
//# sourceMappingURL=parenting_events.d.ts.map