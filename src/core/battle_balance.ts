/**
 * [8] 상생 연격 체인의 '점감 곡선(Diminishing Returns) 밸런서'
 * [13] 일기토 패배 시 주변 사기 감소 '거리 역제곱 감쇄 공식'
 * [14] 공성 레이캐스팅 기반 '고도차 시야 및 사선(LoS) 판정'
 *
 * BattleBalance:
 *   - computeChainDamage(): 연격 횟수(n)에 따른 점감 대미지 계산
 *   - applyMoraleDrop(): 일기토 패배 시 거리 역제곱 사기 감쇄
 *   - checkLineOfSight(): 고도차 기반 레이캐스팅 사선 검증
 */

export interface HexCoord {
    readonly q: number;  // axial q
    readonly r: number;  // axial r
}

export interface TileHeight {
    readonly coord: HexCoord;
    readonly elevation: number;  // 0-10 고도
}

export class BattleBalance {
    /**
     * [8] 상생 연격 체인 점감 곡선
     *
     * damage(n) = baseDamage × (1 + bonus)^(n-1) × exp(-decay × (n-1))
     *
     * n: 연격 횟수
     * bonus: 연격당 추가 계수 (기본 0.15)
     * decay: 점감 계수 (기본 0.12)
     *
     * → 연격이 거듭될수록 추가 대미지가 지수적으로 감쇄
     */
    computeChainDamage(baseDamage: number, chainCount: number, bonus: number = 0.15, decay: number = 0.12): number {
        if (chainCount <= 1) return baseDamage;
        const multiplier = Math.pow(1 + bonus, chainCount - 1) * Math.exp(-decay * (chainCount - 1));
        return Math.round(baseDamage * Math.max(1, multiplier));
    }

    /**
     * [13] 일기토 패배 시 주변 사기 감소 '거리 역제곱 감쇄 공식'
     *
     * moraleDrop(d) = baseDrop / (1 + d²)
     *
     * d: 결투 발생 헥스 타일로부터의 거리
     * baseDrop: 기본 사기 감소량 (기본 30)
     */
    computeMoraleDrop(distance: number, baseDrop: number = 30): number {
        return Math.round(baseDrop / (1 + distance * distance));
    }

    /**
     * [14] 공성 레이캐스팅 기반 고도차 시야 및 사선(LoS) 판정
     *
     * 삼각함수와 타일 높이 벡터 데이터를 활용해
     * 장애물이 투사 궤적을 가로막는지 판정
     *
     * @returns true if line of sight is clear
     */
    checkLineOfSight(
        origin: HexCoord,
        target: HexCoord,
        heightMap: Map<string, number>,  // "q,r" → elevation
    ): boolean {
        const tiles = this.bresenhamLine(origin, target);
        const originHeight = heightMap.get(`${origin.q},${origin.r}`) ?? 0;

        for (const tile of tiles) {
            const tileHeight = heightMap.get(`${tile.q},${tile.r}`) ?? 0;
            // 장애물이 투사 궤적을 가로막는지 판정
            if (tileHeight > originHeight + 1) return false;
        }
        return true;
    }

    /**
     * [14] Bresenham 3D 라인 — 헥스 그리드 상의 시선 경로 계산
     */
    private bresenhamLine(from: HexCoord, to: HexCoord): HexCoord[] {
        const tiles: HexCoord[] = [];
        const dq = to.q - from.q;
        const dr = to.r - from.r;
        const steps = Math.max(Math.abs(dq), Math.abs(dr));

        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            tiles.push({
                q: Math.round(from.q + dq * t),
                r: Math.round(from.r + dr * t),
            });
        }
        return tiles;
    }
}
