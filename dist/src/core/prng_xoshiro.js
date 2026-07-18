/**
 * [Task 3] Xoshiro128++ 결정론적 PRNG
 *
 * 세이브/로드 시 동일한 전투 및 내정 결과가 보장되도록
 * 시드(Seed) 기반 난수 생성기.
 */
export class Xoshiro128 {
    constructor(seed) {
        this.s = new Uint32Array(4);
        this.s[0] = seed >>> 0;
        this.s[1] = (seed * 1812433253 + 1) >>> 0;
        this.s[2] = (this.s[1] * 1812433253 + 1) >>> 0;
        this.s[3] = (this.s[2] * 1812433253 + 1) >>> 0;
    }
    next() {
        const s = this.s;
        const result = Math.imul(s[0] + s[3] | 0, 0x9E3779BB) >>> 0;
        const t = s[1] << 9;
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;
        s[3] = (s[3] << 11 | s[3] >>> 21) >>> 0;
        return result;
    }
    /** 0 ~ 1 사이 부동소수 반환 */
    float() {
        return (this.next() >>> 0) / 4294967296;
    }
    /** min ~ max 사이 정수 반환 */
    int(min, max) {
        return min + Math.floor(this.float() * (max - min + 1));
    }
    getState() {
        return new Uint32Array(this.s);
    }
    setState(state) {
        this.s = new Uint32Array(state);
    }
}
//# sourceMappingURL=prng_xoshiro.js.map