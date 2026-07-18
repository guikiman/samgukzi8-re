/**
 * [Task 35] 상호작용 이력 링 버퍼 — InteractionRingBuffer
 *
 * 최근 상호작용을 고정 크기 링 버퍼에 저장하여 메모리 바운드 제어.
 */

import type { OfficerID } from "./types.js";

export type InteractionType =
  | "MEETING" | "GIFT" | "FEAST" | "BATTLE_TOGETHER" | "DUEL" | "DEBATE"
  | "MISSION" | "TRAINING" | "DIPLOMACY" | "BETRAYAL" | "MARRIAGE" | "FAMILY_EVENT";

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

export class InteractionRingBuffer {
  private buffer: (InteractionRecord | undefined)[];
  private head = 0;
  private count = 0;
  private readonly size: number;
  private idCounter = 0;

  constructor(size = 1000) {
    this.size = size;
    this.buffer = new Array(size);
  }

  push(record: Omit<InteractionRecord, "id">): InteractionRecord {
    const id = `int_${this.idCounter++}_${Date.now()}`;
    const full: InteractionRecord = { id, ...record };
    this.buffer[this.head] = full;
    this.head = (this.head + 1) % this.size;
    if (this.count < this.size) this.count++;
    return full;
  }

  query(query: InteractionQuery): InteractionRecord[] {
    const results = this.toArray();
    return results.filter((r) => {
      if (query.sourceId && r.sourceId !== query.sourceId) return false;
      if (query.targetId && r.targetId !== query.targetId) return false;
      if (query.type && r.type !== query.type) return false;
      if (query.sinceTurn && r.turn < query.sinceTurn) return false;
      return true;
    }).slice(0, query.limit ?? this.count);
  }

  getInteractionsBetween(a: OfficerID, b: OfficerID, limit = 50): InteractionRecord[] {
    return this.query({ sourceId: a, targetId: b, limit })
      .concat(this.query({ sourceId: b, targetId: a, limit }))
      .sort((x, y) => y.turn - x.turn)
      .slice(0, limit);
  }

  getInteractionsByOfficer(officerId: OfficerID, limit = 100): InteractionRecord[] {
    return this.toArray()
      .filter((r) => r.sourceId === officerId || r.targetId === officerId)
      .slice(0, limit);
  }

  getInteractionsByType(type: InteractionType, limit = 100): InteractionRecord[] {
    return this.toArray().filter((r) => r.type === type).slice(0, limit);
  }

  getRecentInteractions(count: number): InteractionRecord[] {
    return this.toArray().slice(0, Math.min(count, this.count));
  }

  getInteractionCount(): number {
    return this.count;
  }

  getCapacity(): number {
    return this.size;
  }

  clear(): void {
    this.buffer = new Array(this.size);
    this.head = 0;
    this.count = 0;
  }

  getInteractionFrequency(officerId: OfficerID, sinceTurn: number): number {
    return this.toArray().filter((r) => (r.sourceId === officerId || r.targetId === officerId) && r.turn >= sinceTurn).length;
  }

  getLastInteractionBetween(a: OfficerID, b: OfficerID): InteractionRecord | null {
    const all = this.getInteractionsBetween(a, b, 1);
    return all.length > 0 ? all[0] : null;
  }

  toArray(): InteractionRecord[] {
    const result: InteractionRecord[] = [];
    const start = this.count < this.size ? 0 : this.head;
    const len = this.count;
    for (let i = 0; i < len; i++) {
      const idx = (start + i) % this.size;
      const record = this.buffer[idx];
      if (record) result.push(record);
    }
    return result.reverse();
  }
}
