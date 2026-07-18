/**
 * [Task 35] 상호작용 이력 링 버퍼 — InteractionRingBuffer
 *
 * 최근 상호작용을 고정 크기 링 버퍼에 저장하여 메모리 바운드 제어.
 */
export class InteractionRingBuffer {
    constructor(size = 1000) {
        this.head = 0;
        this.count = 0;
        this.idCounter = 0;
        this.size = size;
        this.buffer = new Array(size);
    }
    push(record) {
        const id = `int_${this.idCounter++}_${Date.now()}`;
        const full = { id, ...record };
        this.buffer[this.head] = full;
        this.head = (this.head + 1) % this.size;
        if (this.count < this.size)
            this.count++;
        return full;
    }
    query(query) {
        const results = this.toArray();
        return results.filter((r) => {
            if (query.sourceId && r.sourceId !== query.sourceId)
                return false;
            if (query.targetId && r.targetId !== query.targetId)
                return false;
            if (query.type && r.type !== query.type)
                return false;
            if (query.sinceTurn && r.turn < query.sinceTurn)
                return false;
            return true;
        }).slice(0, query.limit ?? this.count);
    }
    getInteractionsBetween(a, b, limit = 50) {
        return this.query({ sourceId: a, targetId: b, limit })
            .concat(this.query({ sourceId: b, targetId: a, limit }))
            .sort((x, y) => y.turn - x.turn)
            .slice(0, limit);
    }
    getInteractionsByOfficer(officerId, limit = 100) {
        return this.toArray()
            .filter((r) => r.sourceId === officerId || r.targetId === officerId)
            .slice(0, limit);
    }
    getInteractionsByType(type, limit = 100) {
        return this.toArray().filter((r) => r.type === type).slice(0, limit);
    }
    getRecentInteractions(count) {
        return this.toArray().slice(0, Math.min(count, this.count));
    }
    getInteractionCount() {
        return this.count;
    }
    getCapacity() {
        return this.size;
    }
    clear() {
        this.buffer = new Array(this.size);
        this.head = 0;
        this.count = 0;
    }
    getInteractionFrequency(officerId, sinceTurn) {
        return this.toArray().filter((r) => (r.sourceId === officerId || r.targetId === officerId) && r.turn >= sinceTurn).length;
    }
    getLastInteractionBetween(a, b) {
        const all = this.getInteractionsBetween(a, b, 1);
        return all.length > 0 ? all[0] : null;
    }
    toArray() {
        const result = [];
        const start = this.count < this.size ? 0 : this.head;
        const len = this.count;
        for (let i = 0; i < len; i++) {
            const idx = (start + i) % this.size;
            const record = this.buffer[idx];
            if (record)
                result.push(record);
        }
        return result.reverse();
    }
}
//# sourceMappingURL=interaction_ring_buffer.js.map