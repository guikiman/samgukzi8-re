/**
 * [Task 3] Xoshiro128++ 결정론적 PRNG
 *
 * 세이브/로드 시 동일한 전투 및 내정 결과가 보장되도록
 * 시드(Seed) 기반 난수 생성기.
 */
export declare class Xoshiro128 {
    private s;
    constructor(seed: number);
    next(): number;
    /** 0 ~ 1 사이 부동소수 반환 */
    float(): number;
    /** min ~ max 사이 정수 반환 */
    int(min: number, max: number): number;
    getState(): Uint32Array;
    setState(state: Uint32Array): void;
}
//# sourceMappingURL=prng_xoshiro.d.ts.map