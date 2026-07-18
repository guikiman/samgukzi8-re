/**
 * [B19] 화공 화염 확산 시뮬레이터 — FireSpreadSimulator
 *
 * 목적: 맵 내 발화된 타일이 풍향, 풍속, 타일 지형 속성에 따라
 *       실시간으로 번져나가는 세포 자동자(Cellular Automata) 알고리즘.
 *
 * 핵심 로직:
 *   1. 매 턴 종료 시 불타는 타일의 인접 타일 추출
 *   2. 숲(FOREST) + 바람 방향 일치 시 발화율 80%
 *   3. 위에 서 있는 부대 턴당 고정 데미지
 */

export type TileTerrain = 'PLAIN' | 'FOREST' | 'MOUNTAIN' | 'WATER' | 'MARSH' | 'CITY' | 'DESERT';

export interface FireTile {
    readonly q: number;
    readonly r: number;
    readonly intensity: number;          // 1~100
    readonly turnsBurning: number;
    readonly terrain: TileTerrain;
}

export interface FireSpreadResult {
    readonly newFireTiles: FireTile[];
    readonly extinguishedTiles: FireTile[];  // intensity 0 도달
    readonly unitDamageMap: Map<string, number>; // unitId → damage
}

const HEX_DIRECTIONS: [number, number][] = [
    [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];

const TERRAIN_FIRE_RATE: Record<TileTerrain, number> = {
    PLAIN: 0.2,
    FOREST: 0.8,
    MOUNTAIN: 0.1,
    WATER: 0,
    MARSH: 0.1,
    CITY: 0.3,
    DESERT: 0.05,
};

const TERRAIN_FIRE_DAMAGE: Record<TileTerrain, number> = {
    PLAIN: 10,
    FOREST: 25,
    MOUNTAIN: 8,
    WATER: 0,
    MARSH: 5,
    CITY: 15,
    DESERT: 5,
};

export class FireSpreadSimulator {
    private burningTiles: Map<string, FireTile> = new Map();

    /**
     * 매 턴 화염 확산 처리
     *
     * @param windDx    - 풍향 x 성분 (-1~1)
     * @param windDy    - 풍향 y 성분 (-1~1)
     * @param unitPositions - "q,r" → unitId 맵 (화염 데미지용)
     */
    simulateSpread(
        windDx: number,
        windDy: number,
        terrainMap: Map<string, TileTerrain>,
        unitPositions: Map<string, string>,
    ): FireSpreadResult {
        const newFireTiles: FireTile[] = [];
        const extinguishedTiles: FireTile[] = [];
        const unitDamageMap = new Map<string, number>();

        const currentFires = Array.from(this.burningTiles.values());

        for (const fire of currentFires) {
            // 화염 강도 감소 (매 턴 -20)
            const newIntensity = fire.intensity - 20;
            if (newIntensity <= 0) {
                extinguishedTiles.push(fire);
                this.burningTiles.delete(`${fire.q},${fire.r}`);
                continue;
            }

            // 현재 불타는 타일 업데이트
            this.burningTiles.set(`${fire.q},${fire.r}`, {
                ...fire,
                intensity: newIntensity,
                turnsBurning: fire.turnsBurning + 1,
            });

            // 위에 있는 부대 데미지
            const unitKey = `${fire.q},${fire.r}`;
            const unitId = unitPositions.get(unitKey);
            if (unitId) {
                const dmg = Math.floor(TERRAIN_FIRE_DAMAGE[fire.terrain] * (newIntensity / 100));
                unitDamageMap.set(unitId, (unitDamageMap.get(unitId) ?? 0) + dmg);
            }

            // 인접 타일 확산
            for (const [dq, dr] of HEX_DIRECTIONS) {
                const nq = fire.q + dq;
                const nr = fire.r + dr;
                const nKey = `${nq},${nr}`;

                if (this.burningTiles.has(nKey)) continue;

                const terrain = terrainMap.get(nKey);
                if (!terrain) continue;

                // 풍향 보정: 바람 방향 타일은 발화율 증가
                const windBonus = (dq === Math.round(windDx) && dr === Math.round(windDy)) ? 0.3 : 0;
                const baseRate = TERRAIN_FIRE_RATE[terrain];
                const spreadChance = Math.min(1.0, baseRate + windBonus);

                if (Math.random() < spreadChance) {
                    const newFire: FireTile = {
                        q: nq, r: nr,
                        intensity: 80,
                        turnsBurning: 0,
                        terrain,
                    };
                    this.burningTiles.set(nKey, newFire);
                    newFireTiles.push(newFire);
                }
            }
        }

        return { newFireTiles, extinguishedTiles, unitDamageMap };
    }

    /** 특정 타일 발화 (화공 전법 등) */
    ignite(q: number, r: number, terrain: TileTerrain, intensity: number = 80): boolean {
        const key = `${q},${r}`;
        if (this.burningTiles.has(key)) return false;
        if (TERRAIN_FIRE_RATE[terrain] <= 0) return false; // WATER 등 불붙지 않음

        this.burningTiles.set(key, { q, r, intensity, turnsBurning: 0, terrain });
        return true;
    }

    /** 현재 불타는 타일 목록 */
    getBurningTiles(): FireTile[] {
        return Array.from(this.burningTiles.values());
    }

    /** 전장 초기화 */
    clearAll(): void {
        this.burningTiles.clear();
    }
}
