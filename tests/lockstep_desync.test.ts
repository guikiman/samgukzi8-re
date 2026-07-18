/**
 * [2] 1,000회 LCG PRNG 락스텝 Desync 추적 자동화
 *
 * LCG PRNG 기반 시뮬레이터를 1,000회 연속 구동하여
 * 양측 상태 트리의 Checksum이 일치하는지 검증.
 *
 * PRNG 공식: X_{n+1} = (a * X_n + c) mod m
 */

import { describe, it, expect } from 'vitest';

class LCGSimulator {
    private state: number;
    private readonly a = 1664525;
    private readonly c = 1013904223;
    private readonly m = 4294967296;

    constructor(seed: number) {
        this.state = seed >>> 0;
    }

    next(): number {
        this.state = ((this.a * this.state) + this.c) >>> 0;
        return this.state;
    }

    checksum(): number {
        let hash = this.state;
        for (let i = 0; i < 100; i++) {
            hash = ((hash << 5) - hash + this.next()) >>> 0;
        }
        return hash;
    }

    fork(offset: number): LCGSimulator {
        const forked = new LCGSimulator(this.state);
        for (let i = 0; i < offset; i++) forked.next();
        return forked;
    }
}

describe('Lockstep Desync Detection [2]', () => {
    it('동일 시드의 PRNG는 1,000회 후에도 동일한 체크섬을 가진다', () => {
        const seed = Date.now();
        const simA = new LCGSimulator(seed);
        const simB = new LCGSimulator(seed);

        for (let i = 0; i < 1000; i++) {
            simA.next();
            simB.next();

            // 매 100 스텝마다 체크섬 검증
            if (i % 100 === 0) {
                expect(simA.checksum()).toBe(simB.checksum());
            }
        }

        // 1,000회 후 최종 체크섬
        expect(simA.checksum()).toBe(simB.checksum());
    });

    it('다른 시드는 다른 체크섬을 가진다', () => {
        const simA = new LCGSimulator(42);
        const simB = new LCGSimulator(43);

        for (let i = 0; i < 100; i++) {
            simA.next();
            simB.next();
        }

        expect(simA.checksum()).not.toBe(simB.checksum());
    });

    it('Desync 감지: 프레임 누락 시 체크섬 불일치', () => {
        const seed = 12345;
        const simA = new LCGSimulator(seed);
        const simB = new LCGSimulator(seed);

        for (let i = 0; i < 500; i++) {
            simA.next();
            if (i !== 250) simB.next(); // 250번째 프레임 누락 (Desync)
        }

        expect(simA.checksum()).not.toBe(simB.checksum());
    });

    it('Fork 복제: 분기 후에도 독립적 체크섬 유지', () => {
        const sim = new LCGSimulator(999);
        for (let i = 0; i < 50; i++) sim.next();

        const forkA = sim.fork(10);
        const forkB = sim.fork(10);

        for (let i = 0; i < 100; i++) {
            forkA.next();
            forkB.next();
        }

        expect(forkA.checksum()).toBe(forkB.checksum());
    });
});
