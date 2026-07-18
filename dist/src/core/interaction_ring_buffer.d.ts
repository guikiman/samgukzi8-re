/**
 * [Task 35] 상호작용 이력 링 버퍼 — InteractionRingBuffer
 *
 * 최근 상호작용을 고정 크기 링 버퍼에 저장하여 메모리 바운드 제어.
 */
import type { OfficerID } from "./types.js";
export type InteractionType = "MEETING" | "GIFT" | "FEAST" | "BATTLE_TOGETHER" | "DUEL" | "DEBATE" | "MISSION" | "TRAINING" | "DIPLOMACY" | "BETRAYAL" | "MARRIAGE" | "FAMILY_EVENT";
export interface InteractionRecord {
    readonly id: string;
    readonly sourceId: OfficerID;
    readonly targetId: OfficerID;
    readonly type: InteractionType;
    readonly affinityDelta: number;
    readonly turn: number;
    readonly year: number;
    readonly month: number;
    readonly description: string;
}
export interface InteractionQuery {
    readonly sourceId?: OfficerID;
    readonly targetId?: OfficerID;
    readonly type?: InteractionType;
    readonly sinceTurn?: number;
    readonly limit?: number;
}
export declare class InteractionRingBuffer {
    private buffer;
    private head;
    private count;
    private readonly size;
    private idCounter;
    constructor(size?: number);
    push(record: Omit<InteractionRecord, "id">): InteractionRecord;
    query(query: InteractionQuery): InteractionRecord[];
    getInteractionsBetween(a: OfficerID, b: OfficerID, limit?: number): InteractionRecord[];
    getInteractionsByOfficer(officerId: OfficerID, limit?: number): InteractionRecord[];
    getInteractionsByType(type: InteractionType, limit?: number): InteractionRecord[];
    getRecentInteractions(count: number): InteractionRecord[];
    getInteractionCount(): number;
    getCapacity(): number;
    clear(): void;
    getInteractionFrequency(officerId: OfficerID, sinceTurn: number): number;
    getLastInteractionBetween(a: OfficerID, b: OfficerID): InteractionRecord | null;
    toArray(): InteractionRecord[];
}
//# sourceMappingURL=interaction_ring_buffer.d.ts.map