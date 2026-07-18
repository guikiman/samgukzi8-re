/**
 * [Task 9] 인메모리 스냅샷 버퍼 스택
 *
 * 턴 실행 중 브라우저 크래시나 메모리 누수 발생 시
 * 직전 페이즈로 롤백할 수 있는 스냅샷 버퍼 스택 (최대 5개).
 */

import { deepClone } from "./state_immutability";

export class StateBackupStack<T extends object> {
  private snapshots: T[] = [];
  private readonly maxSnapshots: number;

  constructor(maxSnapshots = 5) {
    this.maxSnapshots = maxSnapshots;
  }

  push(state: T): void {
    this.snapshots.push(deepClone(state));
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  pop(): T | null {
    if (this.snapshots.length === 0) return null;
    return this.snapshots.pop()!;
  }

  peek(): T | null {
    if (this.snapshots.length === 0) return null;
    return deepClone(this.snapshots[this.snapshots.length - 1]);
  }

  get size(): number {
    return this.snapshots.length;
  }

  clear(): void {
    this.snapshots = [];
  }
}
