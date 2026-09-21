import { describe, it, expect } from 'vitest';
import {
    areCitiesAdjacent,
    getAdjacentFriendlyCities,
    assembleReinforcements,
    canAttackFrom,
} from '../src/core/reinforcement_system';
import type { City, Officer, Army } from '../src/core/types';

// ============================================================
// 테스트용 픽스처 생성 헬퍼
// ============================================================

let seq = 0;
function makeCity(
    id: string,
    name: string,
    ownerId: string | null,
    population = 50000,
    mapX?: number,
    mapY?: number,
): City {
    return {
        id,
        name,
        hexCoord: { q: seq++, r: 0 },
        mapX,
        mapY,
        population,
        defense: 100,
        maxDefense: 100,
        goldIncome: 10,
        foodIncome: 10,
        funds: 500,
        facilities: [],
        officerIds: [],
        ownerId,
        isCapital: false,
        development: 30,
        developmentStats: {
            commerce: 30,
            maxCommerce: 100,
            farming: 30,
            maxFarming: 100,
            technology: 30,
            maxTechnology: 100,
            publicOrder: 50,
            maxPublicOrder: 100,
        },
        loyalty: 70,
        danger: 0,
        weather: '맑음' as City['weather'],
    };
}

function makeOfficer(id: string, name: string, cityId: string | null, factionId: string | null, leadership = 70): Officer {
    return {
        id,
        name,
        courtesy: '공',
        factionId,
        cityId,
        rank: 'GENERAL' as Officer['rank'],
        status: 'ACTIVE' as Officer['status'],
        stats: { leadership, might: 60, intelligence: 60, politics: 60, charisma: 60 },
        loyalty: 80,
        ambition: 3,
        gold: 100,
        fame: 100,
        age: 30,
        isPlayerControlled: false,
    } as unknown as Officer;
}

function makeArmy(id: string, commanderId: string, originCityId: string, soldiers: number): Army {
    return {
        id,
        commanderId,
        officerIds: [commanderId],
        soldiers,
        morale: 80,
        training: 70,
        supplies: 100,
        originCityId,
        targetCityId: null,
        position: null,
        banner: 'test',
    };
}

// ============================================================
// 인접 판정
// ============================================================

describe('도시 인접 판정', () => {
    it('허창-업은 인접으로 판정된다', () => {
        expect(areCitiesAdjacent('허창', '업')).toBe(true);
    });

    it('허창-건업은 인접하지 않다', () => {
        expect(areCitiesAdjacent('허창', '건업')).toBe(false);
    });

    it('같은 도시는 인접이 아니다', () => {
        expect(areCitiesAdjacent('허창', '허창')).toBe(false);
    });

    it('출진 가능 판정도 인접 판정과 동일하다', () => {
        expect(canAttackFrom('허창', '낙양')).toBe(true);
        expect(canAttackFrom('허창', '오')).toBe(false);
    });
});

// ============================================================
// 인접 아군 도시 조회
// ============================================================

describe('인접 아군 도시 조회', () => {
    it('같은 세력의 인접 도시만 반환한다', () => {
        const cities = [
            makeCity('허창', '허창', 'fac_1', 50000, 0.55, 0.3),
            makeCity('낙양', '낙양', 'fac_1', 50000, 0.5, 0.35),
            makeCity('서주', '서주', 'fac_2', 50000, 0.7, 0.4),
        ];
        const result = getAdjacentFriendlyCities('허창', 'fac_1', cities);
        expect(result.map((c) => c.id)).toContain('낙양');
        expect(result.map((c) => c.id)).not.toContain('서주');
    });

    it('다른 세력 도시는 아군으로 세지 않는다', () => {
        const cities = [
            makeCity('허창', '허창', 'fac_1', 50000, 0.55, 0.3),
            makeCity('낙양', '낙양', 'fac_2', 50000, 0.5, 0.35),
        ];
        const result = getAdjacentFriendlyCities('허창', 'fac_1', cities);
        expect(result).toHaveLength(0);
    });
});

// ============================================================
// 증원 편성
// ============================================================

describe('증원 편성', () => {
    it('인접 아군 도시에서 병력과 무장을 파견한다', () => {
        const cities = [
            makeCity('허창', '허창', 'fac_1'),
            makeCity('낙양', '낙양', 'fac_1'),
        ];
        const officers = [
            makeOfficer('o1', '하후돈', '낙양', 'fac_1', 90),
            makeOfficer('o2', '하후연', '낙양', 'fac_1', 85),
            makeOfficer('o3', '순욱', '낙양', 'fac_1', 40),
        ];
        const armies = [makeArmy('a1', 'o1', '낙양', 3000)];

        const result = assembleReinforcements('허창', 'fac_1', cities, officers, armies);

        expect(result.totalTroops).toBe(3000);
        expect(result.contingents[0].sourceCityId).toBe('낙양');
        // 통솔 높은 순 최대 2명, 1명은 도시에 잔류
        expect(result.officerIds).toContain('o1');
        expect(result.officerIds).toContain('o2');
        expect(result.officerIds).not.toContain('o3');
    });

    it('부대가 없는 도시는 인구 기반 소규모 지원군을 편성한다', () => {
        const cities = [
            makeCity('허창', '허창', 'fac_1'),
            makeCity('낙양', '낙양', 'fac_1', 50000),
        ];
        const officers = [makeOfficer('o1', '관우', '낙양', 'fac_1', 95)];
        const result = assembleReinforcements('허창', 'fac_1', cities, officers, []);
        // 인구 50,000 × 2% = 1,000명
        expect(result.totalTroops).toBe(1000);
        // 무장 1명뿐이면 도시에 1명은 남아야 하므로 파견 0명
        expect(result.officerIds).toHaveLength(0);
    });

    it('방어 도시가 없으면 증원 0', () => {
        const cities = [makeCity('허창', '허창', 'fac_1')];
        const result = assembleReinforcements('허창', 'fac_1', cities, [], []);
        expect(result.totalTroops).toBe(0);
        expect(result.contingents).toHaveLength(0);
    });

    it('적 세력 소유 도시로는 증원하지 않는다', () => {
        const cities = [
            makeCity('허창', '허창', 'fac_1'),
            makeCity('낙양', '낙양', 'fac_2'),
        ];
        const officers = [makeOfficer('o1', '여포', '낙양', 'fac_2', 95)];
        const result = assembleReinforcements('허창', 'fac_1', cities, officers, []);
        expect(result.totalTroops).toBe(0);
    });
});
