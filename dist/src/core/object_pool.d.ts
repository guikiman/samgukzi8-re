/**
 * [Task 43] 대량 유닛 연산 최적화 (Object Pool)
 *
 * 가비지 컬렉션 방지를 위해 루프 내부에서 오브젝트 리터럴 생성을
 * 최소화하고 재사용 가능한 풀 구조를 오케스트레이터 내부에 통합.
 */
export declare class ObjectPool<T> {
    private pool;
    private readonly factory;
    private readonly reset;
    private readonly initialSize;
    constructor(factory: () => T, reset: (obj: T) => void, initialSize?: number);
    private preAllocate;
    acquire(): T;
    release(obj: T): void;
    get size(): number;
    grow(extra: number): void;
}
//# sourceMappingURL=object_pool.d.ts.map