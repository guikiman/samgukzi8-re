/**
 * [Task 9] 인메모리 스냅샷 버퍼 스택
 *
 * 턴 실행 중 브라우저 크래시나 메모리 누수 발생 시
 * 직전 페이즈로 롤백할 수 있는 스냅샷 버퍼 스택 (최대 5개).
 */
import { deepClone } from "./state_immutability";
export class StateBackupStack {
    constructor(maxSnapshots = 5) {
        this.snapshots = [];
        this.maxSnapshots = maxSnapshots;
    }
    push(state) {
        this.snapshots.push(deepClone(state));
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }
    pop() {
        if (this.snapshots.length === 0)
            return null;
        return this.snapshots.pop();
    }
    peek() {
        if (this.snapshots.length === 0)
            return null;
        return deepClone(this.snapshots[this.snapshots.length - 1]);
    }
    get size() {
        return this.snapshots.length;
    }
    clear() {
        this.snapshots = [];
    }
}
//# sourceMappingURL=state_backup.js.map