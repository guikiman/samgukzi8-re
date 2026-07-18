/**
 * [Task 30] 커맨드 롤백 데이터 구조 (Undo Buffer)
 *
 * 단일 턴 내에서 플레이어가 제출한 명령을 확정하기 전에
 * 한 단계씩 안전하게 취소할 수 있는 명령 Undo 아카이브.
 */

export interface UndoEntry<T> {
  readonly factionId: string;
  readonly command: T;
  readonly previousState: T;
  readonly timestamp: number;
}

export class UndoBuffer<T> {
  private stack: UndoEntry<T>[] = [];
  private readonly maxDepth: number;

  constructor(maxDepth = 10) {
    this.maxDepth = maxDepth;
  }

  push(factionId: string, command: T, previousState: T): void {
    this.stack.push({ factionId, command, previousState, timestamp: Date.now() });
    if (this.stack.length > this.maxDepth) {
      this.stack.shift();
    }
  }

  undo(): UndoEntry<T> | null {
    return this.stack.pop() ?? null;
  }

  peek(): UndoEntry<T> | null {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  clear(): void {
    this.stack = [];
  }

  get size(): number {
    return this.stack.length;
  }
}
