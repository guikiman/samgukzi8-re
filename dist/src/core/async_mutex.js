/**
 * [Task 17] 비동기 상호배제(Mutex) 락
 *
 * 연산이 완료되기 전까지 새로운 루프 주기가 시작되지
 * 않도록 제어하는 비동기 뮤텍스.
 */
export class AsyncMutex {
    constructor() {
        this.locked = false;
        this.queue = [];
    }
    async acquire() {
        if (!this.locked) {
            this.locked = true;
            return;
        }
        return new Promise((resolve) => {
            this.queue.push(resolve);
        });
    }
    release() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
        }
        else {
            this.locked = false;
        }
    }
    get isLocked() {
        return this.locked;
    }
}
//# sourceMappingURL=async_mutex.js.map