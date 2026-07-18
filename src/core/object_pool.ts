/**
 * [Task 43] 대량 유닛 연산 최적화 (Object Pool)
 *
 * 가비지 컬렉션 방지를 위해 루프 내부에서 오브젝트 리터럴 생성을
 * 최소화하고 재사용 가능한 풀 구조를 오케스트레이터 내부에 통합.
 */

export class ObjectPool<T> {
  private pool: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (obj: T) => void;
  private readonly initialSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 100) {
    this.factory = factory;
    this.reset = reset;
    this.initialSize = initialSize;
    this.preAllocate();
  }

  private preAllocate(): void {
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  get size(): number {
    return this.pool.length;
  }

  grow(extra: number): void {
    for (let i = 0; i < extra; i++) {
      this.pool.push(this.factory());
    }
  }
}
