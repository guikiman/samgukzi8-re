/**
 * [B13] 수역/함선 상성 시스템 — Naval Combat System
 *
 * ShipType: TRANSPORT | PATROL | WARSHIP | MENGCHONG | LOUSCHUAN
 * 함선 상성: LOUSCHUAN > MENGCHONG > WARSHIP > PATROL > TRANSPORT
 * 날씨 영향: 폭풍 이동력 -50%, 안개 시야 -70%
 */
const SHIP_STATS = {
    TRANSPORT: { type: 'TRANSPORT', name: '수송선', speed: 3, defense: 2, attack: 0, capacity: 5000, cost: 200, special: '대량 수송' },
    PATROL: { type: 'PATROL', name: '초계선', speed: 5, defense: 3, attack: 10, capacity: 1000, cost: 300, special: '고속 이동' },
    WARSHIP: { type: 'WARSHIP', name: '전함', speed: 4, defense: 5, attack: 20, capacity: 2000, cost: 500, special: '균형 전투' },
    MENGCHONG: { type: 'MENGCHONG', name: '몽충', speed: 3, defense: 7, attack: 30, capacity: 1500, cost: 700, special: '충각 돌진' },
    LOUSCHUAN: { type: 'LOUSCHUAN', name: '누선', speed: 2, defense: 9, attack: 40, capacity: 3000, cost: 1000, special: '원거리 포격' },
};
const SHIP_COUNTER = {
    LOUSCHUAN: 'MENGCHONG',
    MENGCHONG: 'WARSHIP',
    WARSHIP: 'PATROL',
    PATROL: 'TRANSPORT',
    TRANSPORT: 'LOUSCHUAN',
};
const TERRAIN_PENALTY = {
    RIVER: { TRANSPORT: 0, PATROL: 0, WARSHIP: 0.2, MENGCHONG: 0.1, LOUSCHUAN: 0.3 },
    SEA: { TRANSPORT: 0.1, PATROL: 0, WARSHIP: 0, MENGCHONG: 0, LOUSCHUAN: 0 },
    SWAMP: { TRANSPORT: 0.3, PATROL: 0.2, WARSHIP: 0.4, MENGCHONG: 0.3, LOUSCHUAN: 0.5 },
    LAKE: { TRANSPORT: 0, PATROL: 0, WARSHIP: 0, MENGCHONG: 0, LOUSCHUAN: 0 },
    SHALLOW: { TRANSPORT: 0.1, PATROL: 0.1, WARSHIP: 0.3, MENGCHONG: 0.2, LOUSCHUAN: 0.5 },
};
const WEATHER_MOVEMENT_PENALTY = {
    SUNNY: 1.0, CLOUDY: 0.9, RAIN: 0.7, SNOW: 0.5, STORM: 0.3, FOG: 0.6,
};
const WEATHER_VISION_PENALTY = {
    SUNNY: 1.0, CLOUDY: 0.9, RAIN: 0.7, SNOW: 0.6, STORM: 0.5, FOG: 0.3,
};
export class NavalCombatSystem {
    getShipStats(shipType) {
        return { ...SHIP_STATS[shipType] };
    }
    getAllShipTypes() {
        return Object.values(SHIP_STATS).map(s => ({ ...s }));
    }
    getShipCounter(attackerType, defenderType) {
        if (SHIP_COUNTER[attackerType] === defenderType)
            return 1.5;
        if (SHIP_COUNTER[defenderType] === attackerType)
            return 0.7;
        return 1.0;
    }
    calculateNavalDamage(attackerShip, defenderShip, attackerStats, _defenderStats, weather) {
        const atk = SHIP_STATS[attackerShip];
        const def = SHIP_STATS[defenderShip];
        const counter = this.getShipCounter(attackerShip, defenderShip);
        const leadershipFactor = attackerStats.leadership / 100;
        const weatherFactor = WEATHER_VISION_PENALTY[weather];
        const baseDamage = atk.attack * counter * leadershipFactor * weatherFactor;
        const armorReduction = def.defense * 3;
        return Math.max(1, Math.floor(baseDamage - armorReduction * 0.5));
    }
    getTerrainPenalty(shipType, terrainType) {
        return TERRAIN_PENALTY[terrainType]?.[shipType] ?? 0;
    }
    getMovementCost(shipType, terrainType, weather) {
        const terrainPenalty = this.getTerrainPenalty(shipType, terrainType);
        const weatherPenalty = WEATHER_MOVEMENT_PENALTY[weather];
        const ship = SHIP_STATS[shipType];
        const effectiveSpeed = ship.speed * weatherPenalty * (1 - terrainPenalty);
        return Math.max(0.5, effectiveSpeed);
    }
    getVisionRange(shipType, weather) {
        const baseVision = {
            TRANSPORT: 3, PATROL: 5, WARSHIP: 4, MENGCHONG: 3, LOUSCHUAN: 6,
        };
        return Math.floor(baseVision[shipType] * WEATHER_VISION_PENALTY[weather]);
    }
}
//# sourceMappingURL=naval_combat_system.js.map