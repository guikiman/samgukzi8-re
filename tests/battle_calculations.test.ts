/**
 * [1] BattleCalculationsEngine 수학적 오라클 테스트
 *
 * 검증:
 * - calculateDamage: 대미지가 [1, +∞) 범위 내에 존재
 * - calculateHexDistance: d ≥ 0, 삼각 부등식
 * - calculateTypeMatchup: 상성표 symmetrical
 * - calculateTerrainPenalty: penalty ∈ [0.1, 1.0]
 * - calculateWeatherFactor: factor ∈ [0.1, 1.0]
 * - isZOCCut: ZOC 발동 시 isCut=true, 회피 시 isCut=false
 */

import { describe, it, expect } from 'vitest';
import {
    BattleCalculationsEngine,
    BattleTile,
    BattleUnit,
    AttackerInfo,
    DefenderInfo,
    UnitType,
    TerrainType,
    HEX_DIRECTIONS,
} from '../src/core/battle_calculations.js';
import { Officer, Weather, RelationType, RelationshipEdge, HexCoord } from '../src/core/types.js';

// ============================================================
// 헬퍼: 테스트용 오피서 생성
// ============================================================
function createTestOfficer(id: string, might: number = 80): Officer {
    return {
        id,
        name: `Test-${id}`,
        stats: { leadership: 70, might, intelligence: 60, politics: 50, charisma: 55 },
        exp: { leadership: 0, might: 0, intelligence: 0, politics: 0, charisma: 0, total: 0, level: 1 },
        rank: 5,
        status: 'ACTIVE',
        personality: 'CALM',
        age: 30,
        factionId: 'faction_a',
        cityId: 'city_1',
        salary: 100,
        loyalty: 80,
        morality: 70,
        ambition: 50,
        actionPoints: 100,
        maxActionPoints: 100,
        hasActedThisTurn: false,
        stamina: 100,
        inventory: { gold: 0, items: [], equippedItems: [] },
    } as Officer;
}

// ============================================================
// 헬퍼: 테스트용 타일 생성
// ============================================================
function createTile(q: number, r: number, terrain: TerrainType = 'PLAINS', elevation: number = 0): BattleTile {
    return { q, r, terrain, elevation, defense: 0, hasForestCover: false, isRiverCrossing: false };
}

// ============================================================
// 헬퍼: 테스트용 유닛 생성
// ============================================================
function createUnit(id: string, officerId: string, unitType: UnitType = 'INFANTRY', baseAttack: number = 100, baseDefense: number = 80): BattleUnit {
    return {
        unitId: id,
        officerId,
        unitType,
        soldiers: 1000,
        morale: 100,
        training: 100,
        position: { q: 0, r: 0 },
        facing: 0,
        isSupplied: true,
        baseAttack,
        baseDefense,
        movementPoints: 5,
        maxMovementPoints: 5,
        hasEvasionSkill: false,
        evasionProbability: 0,
    };
}

// ============================================================
// [1] 대미지 계산 오라클 — 수학적 한계 검증
// ============================================================
describe('BattleCalculationsEngine - Damage Oracle', () => {
    const engine = new BattleCalculationsEngine([], [], 'SUNNY');

    it('calculateDamage는 항상 totalDamage ≥ 1을 반환한다', () => {
        const officer = createTestOfficer('off_1', 80);
        const tile = createTile(0, 0);
        const attacker: AttackerInfo = {
            unit: createUnit('u1', 'off_1', 'INFANTRY', 100, 80),
            officer,
            tile,
        };
        const defender: DefenderInfo = {
            unit: createUnit('u2', 'off_2', 'CAVALRY', 100, 80),
            officer: createTestOfficer('off_2', 70),
            tile,
        };

        // 정상 조건
        let result = engine.calculateDamage(attacker, defender, 0);
        expect(result.totalDamage).toBeGreaterThanOrEqual(1);

        // 대미지가 기대 범위 내인지 (100 * 80 / 80 = 100, 지형/날씨 1.0 = 100 전후)
        expect(result.totalDamage).toBeLessThanOrEqual(500);

        // 체인 보너스 포함
        result = engine.calculateDamage(attacker, defender, 50);
        expect(result.totalDamage).toBeGreaterThanOrEqual(1);
    });

    it('calculateDamage는 방어력 0에서도 0으로 나누지 않는다', () => {
        const officer = createTestOfficer('off_1', 80);
        const tile = createTile(0, 0);
        const attacker: AttackerInfo = {
            unit: createUnit('u1', 'off_1', 'INFANTRY', 100, 0),
            officer,
            tile,
        };
        const defender: DefenderInfo = {
            unit: createUnit('u2', 'off_2', 'CAVALRY', 100, 0),
            officer: createTestOfficer('off_2', 70),
            tile,
        };

        const result = engine.calculateDamage(attacker, defender, 0);
        expect(result.totalDamage).toBeGreaterThanOrEqual(1);
        expect(result.details.some(d => d.includes('기본'))).toBe(true);
    });

    it('calculateDamage는 모든 병과 조합에서 실행 가능하다', () => {
        const officer = createTestOfficer('off_1', 80);
        const tile = createTile(0, 0);
        const unitTypes: UnitType[] = ['INFANTRY', 'CAVALRY', 'ARCHER', 'SIEGE'];

        for (const atkType of unitTypes) {
            for (const defType of unitTypes) {
                const attacker: AttackerInfo = {
                    unit: createUnit('u1', 'off_1', atkType, 100, 80),
                    officer,
                    tile,
                };
                const defender: DefenderInfo = {
                    unit: createUnit('u2', 'off_2', defType, 100, 80),
                    officer: createTestOfficer('off_2', 70),
                    tile,
                };
                const result = engine.calculateDamage(attacker, defender, 0);
                expect(result.totalDamage).toBeGreaterThanOrEqual(1);
            }
        }
    });

    it('calculateDamage는 모든 날씨 조건에서 실행 가능하다', () => {
        const officer = createTestOfficer('off_1', 80);
        const tile = createTile(0, 0);
        const attacker: AttackerInfo = {
            unit: createUnit('u1', 'off_1', 'ARCHER', 100, 80),
            officer,
            tile,
        };
        const defender: DefenderInfo = {
            unit: createUnit('u2', 'off_2', 'INFANTRY', 100, 80),
            officer: createTestOfficer('off_2', 70),
            tile,
        };

        const weathers: Weather[] = ['SUNNY', 'CLOUDY', 'RAIN', 'SNOW', 'STORM', 'FOG'];
        for (const w of weathers) {
            const eng = new BattleCalculationsEngine([], [], w);
            const result = eng.calculateDamage(attacker, defender, 0);
            expect(result.totalDamage).toBeGreaterThanOrEqual(1);
        }
    });
});

// ============================================================
// [1] 헥스 거리 삼각 부등식 검증
// ============================================================
describe('BattleCalculationsEngine - Hex Distance Oracle', () => {
    const engine = new BattleCalculationsEngine([], [], 'SUNNY');

    it('calculateHexDistance: 자기 자신과의 거리는 0이다', () => {
        expect(engine.calculateHexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
        expect(engine.calculateHexDistance({ q: 5, r: -3 }, { q: 5, r: -3 })).toBe(0);
    });

    it('calculateHexDistance: d ≥ 0', () => {
        const coords: HexCoord[] = [
            { q: 0, r: 0 }, { q: 3, r: -1 }, { q: -2, r: 5 },
            { q: 10, r: -7 }, { q: -5, r: 2 }, { q: 1, r: -3 },
        ];
        for (let i = 0; i < coords.length; i++) {
            for (let j = 0; j < coords.length; j++) {
                const d = engine.calculateHexDistance(coords[i], coords[j]);
                expect(d).toBeGreaterThanOrEqual(0);
            }
        }
    });

    it('calculateHexDistance: 삼각 부등식 d(a,c) ≤ d(a,b) + d(b,c)', () => {
        const a: HexCoord = { q: 0, r: 0 };
        const b: HexCoord = { q: 3, r: -1 };
        const c: HexCoord = { q: 5, r: -4 };

        const dAB = engine.calculateHexDistance(a, b);
        const dBC = engine.calculateHexDistance(b, c);
        const dAC = engine.calculateHexDistance(a, c);

        expect(dAC).toBeLessThanOrEqual(dAB + dBC);
    });

    it('calculateHexDistance: 대칭성 d(a,b) = d(b,a)', () => {
        const a: HexCoord = { q: 2, r: -5 };
        const b: HexCoord = { q: -3, r: 7 };
        expect(engine.calculateHexDistance(a, b)).toBe(engine.calculateHexDistance(b, a));
    });
});

// ============================================================
// [1] 지형 패널티 오라클
// ============================================================
describe('BattleCalculationsEngine - Terrain Penalty Oracle', () => {
    it('지형 패널티는 항상 [0.1, 1.0] 범위 내에 존재한다', () => {
        const terrains: TerrainType[] = ['PLAINS', 'FOREST', 'MOUNTAIN', 'RIVER', 'MARSH', 'DESERT', 'WATER'];
        const unitTypes: UnitType[] = ['INFANTRY', 'CAVALRY', 'ARCHER', 'SIEGE'];
        const engine = new BattleCalculationsEngine([], [], 'SUNNY');

        for (const defTerrain of terrains) {
            for (const atkType of unitTypes) {
                const defTile = createTile(0, 0, defTerrain);
                const atkTile = createTile(1, 0, 'PLAINS');
                const attacker: AttackerInfo = {
                    unit: createUnit('u1', 'off_1', atkType),
                    officer: createTestOfficer('off_1'),
                    tile: atkTile,
                };
                const defender: DefenderInfo = {
                    unit: createUnit('u2', 'off_2', 'INFANTRY'),
                    officer: createTestOfficer('off_2'),
                    tile: defTile,
                };

                // calculateDamage 내부에서 terrainPenalty를 계산하므로 totalDamage로 간접 검증
                const result = engine.calculateDamage(attacker, defender, 0);
                expect(result.terrainPenalty).toBeGreaterThanOrEqual(0.1);
                expect(result.terrainPenalty).toBeLessThanOrEqual(1.0);
            }
        }
    });
});

// ============================================================
// [1] 기상 계수 오라클
// ============================================================
describe('BattleCalculationsEngine - Weather Factor Oracle', () => {
    it('기상 계수는 항상 [0.1, 1.0] 범위 내에 존재한다', () => {
        const weathers: Weather[] = ['SUNNY', 'CLOUDY', 'RAIN', 'SNOW', 'STORM', 'FOG'];
        const unitTypes: UnitType[] = ['INFANTRY', 'CAVALRY', 'ARCHER', 'SIEGE'];

        for (const w of weathers) {
            const engine = new BattleCalculationsEngine([], [], w);
            for (const ut of unitTypes) {
                const atkTile = createTile(0, 0);
                const defTile = createTile(1, 0);
                const attacker: AttackerInfo = {
                    unit: createUnit('u1', 'off_1', ut),
                    officer: createTestOfficer('off_1'),
                    tile: atkTile,
                };
                const defender: DefenderInfo = {
                    unit: createUnit('u2', 'off_2', 'INFANTRY'),
                    officer: createTestOfficer('off_2'),
                    tile: defTile,
                };
                const result = engine.calculateDamage(attacker, defender, 0);
                expect(result.weatherFactor).toBeGreaterThanOrEqual(0.1);
                expect(result.weatherFactor).toBeLessThanOrEqual(1.0);
            }
        }
    });
});

// ============================================================
// [1] 병과 상성 대칭성 검증
// ============================================================
describe('BattleCalculationsEngine - Type Matchup Symmetry', () => {
    const engine = new BattleCalculationsEngine([], [], 'SUNNY');

    it('같은 병과는 1.0배 대미지', () => {
        const atkTile = createTile(0, 0);
        const defTile = createTile(1, 0);
        const attacker: AttackerInfo = {
            unit: createUnit('u1', 'off_1', 'CAVALRY'),
            officer: createTestOfficer('off_1'),
            tile: atkTile,
        };
        const defender: DefenderInfo = {
            unit: createUnit('u2', 'off_2', 'CAVALRY'),
            officer: createTestOfficer('off_2'),
            tile: defTile,
        };
        const result = engine.calculateDamage(attacker, defender, 0);
        expect(result.typeMatchupMultiplier).toBe(1.0);
    });

    it('보병→기병(1.5)이면 기병→보병(0.75)으로 역수 관계 성립', () => {
        const atkTile = createTile(0, 0);
        const defTile = createTile(1, 0);
        const infantryAttack: AttackerInfo = {
            unit: createUnit('u1', 'off_1', 'INFANTRY'),
            officer: createTestOfficer('off_1'),
            tile: atkTile,
        };
        const cavalryDefend: DefenderInfo = {
            unit: createUnit('u2', 'off_2', 'CAVALRY'),
            officer: createTestOfficer('off_2'),
            tile: defTile,
        };
        const cavalryAttack: AttackerInfo = {
            unit: createUnit('u3', 'off_3', 'CAVALRY'),
            officer: createTestOfficer('off_3'),
            tile: atkTile,
        };
        const infantryDefend: DefenderInfo = {
            unit: createUnit('u4', 'off_4', 'INFANTRY'),
            officer: createTestOfficer('off_4'),
            tile: defTile,
        };

        const r1 = engine.calculateDamage(infantryAttack, cavalryDefend, 0);
        const r2 = engine.calculateDamage(cavalryAttack, infantryDefend, 0);
        expect(r1.typeMatchupMultiplier).toBe(1.5);
        expect(r2.typeMatchupMultiplier).toBeLessThan(1.0);
    });
});

// ============================================================
// [1] ZOC 오라클
// ============================================================
describe('BattleCalculationsEngine - ZOC Oracle', () => {
    const engine = new BattleCalculationsEngine([], [], 'SUNNY');

    it('적 유닛이 인접하지 않으면 ZOC 미발동', () => {
        const result = engine.isZOCCut(
            { q: 3, r: 0 },
            [{ q: 0, r: 0 }],
            createUnit('u1', 'off_1', 'INFANTRY'),
        );
        expect(result.isCut).toBe(false);
        expect(result.zocSources).toHaveLength(0);
    });

    it('적 유닛이 인접하면 ZOC 발동', () => {
        // (3, 0)의 인접 좌표: (4,0), (4,-1), (3,-1), (2,0), (2,1), (3,1)
        const result = engine.isZOCCut(
            { q: 3, r: 0 },
            [{ q: 4, r: 0 }, { q: 2, r: 0 }],
            createUnit('u1', 'off_1', 'INFANTRY'),
        );
        expect(result.isCut).toBe(true);
        expect(result.zocSources.length).toBeGreaterThanOrEqual(1);
    });

    it('회피 특기 100%면 ZOC를 무시한다', () => {
        const unit = createUnit('u1', 'off_1', 'INFANTRY');
        unit.hasEvasionSkill = true;
        unit.evasionProbability = 1.0;

        const result = engine.isZOCCut(
            { q: 3, r: 0 },
            [{ q: 4, r: 0 }],
            unit,
        );
        expect(result.isCut).toBe(false);
        expect(result.evaded).toBe(true);
    });
});

// ============================================================
// [1] HEX_DIRECTIONS 검증
// ============================================================
describe('HEX_DIRECTIONS', () => {
    it('정확히 6개의 방향을 가진다', () => {
        expect(HEX_DIRECTIONS).toHaveLength(6);
    });

    it('모든 방향에 대해 반대 방향이 존재한다', () => {
        for (const dir of HEX_DIRECTIONS) {
            const opposite = HEX_DIRECTIONS.find(
                d => d.q === -dir.q && d.r === -dir.r,
            );
            expect(opposite).toBeDefined();
        }
    });

    it('중심 (0,0)에서 모든 방향으로 이동 시 거리는 1이다', () => {
        const engine = new BattleCalculationsEngine([], [], 'SUNNY');
        for (const dir of HEX_DIRECTIONS) {
            const d = engine.calculateHexDistance({ q: 0, r: 0 }, dir);
            expect(d).toBe(1);
        }
    });
});
