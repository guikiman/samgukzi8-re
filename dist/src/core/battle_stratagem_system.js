/**
 * [B16][B17] 전장 계략(Stratagems) + 포위망/보급선 시스템
 *
 * BattleStratagemManager:
 *   - ROCKFALL: 광역 물리 데미지
 *   - TRAP: 이동 불가 1턴
 *   - FIRE_ATTACK: 지속 데미지 3턴
 *   - AMBUSH: 적 부대를 아군 방향으로 유인
 *   - BURN_GRANARY: 매턴 사기 -10
 *   각 계략 SPIRIT 소모 (1~3), 지력 높을수록 성공률 증가
 */
export const STRATAGEMS = {
    ROCKFALL: { type: 'ROCKFALL', name: '낙석', spiritCost: 1, range: 2, damage: 25, duration: 0, description: '광역 물리 데미지' },
    TRAP: { type: 'TRAP', name: '함정', spiritCost: 2, range: 3, damage: 0, duration: 1, description: '이동 불가 1턴' },
    FIRE_ATTACK: { type: 'FIRE_ATTACK', name: '화계', spiritCost: 2, range: 2, damage: 15, duration: 3, description: '지속 데미지 3턴' },
    AMBUSH: { type: 'AMBUSH', name: '복병', spiritCost: 1, range: 1, damage: 20, duration: 0, description: '기습 공격' },
    FALSE_RETREAT: { type: 'FALSE_RETREAT', name: '위보', spiritCost: 2, range: 4, damage: 0, duration: 1, description: '적 부대 유인' },
    FLANK: { type: 'FLANK', name: '측면 공격', spiritCost: 1, range: 1, damage: 18, duration: 0, description: '측면 타격' },
    BURN_GRANARY: { type: 'BURN_GRANARY', name: '보급선 차단', spiritCost: 3, range: 5, damage: 0, duration: 5, description: '매턴 사기 -10' },
};
const WEATHER_EFFECT = {
    SUNNY: { ROCKFALL: 1.0, TRAP: 1.0, FIRE_ATTACK: 1.3, AMBUSH: 1.0, FALSE_RETREAT: 1.0, FLANK: 1.0, BURN_GRANARY: 1.0 },
    CLOUDY: { ROCKFALL: 1.0, TRAP: 1.0, FIRE_ATTACK: 1.0, AMBUSH: 1.1, FALSE_RETREAT: 1.0, FLANK: 1.0, BURN_GRANARY: 1.0 },
    RAIN: { ROCKFALL: 0.8, TRAP: 0.9, FIRE_ATTACK: 0.3, AMBUSH: 1.2, FALSE_RETREAT: 0.9, FLANK: 0.9, BURN_GRANARY: 0.8 },
    SNOW: { ROCKFALL: 0.7, TRAP: 0.8, FIRE_ATTACK: 0.2, AMBUSH: 1.3, FALSE_RETREAT: 0.8, FLANK: 0.8, BURN_GRANARY: 0.7 },
    STORM: { ROCKFALL: 0.5, TRAP: 0.5, FIRE_ATTACK: 0.1, AMBUSH: 1.4, FALSE_RETREAT: 0.5, FLANK: 0.5, BURN_GRANARY: 0.5 },
    FOG: { ROCKFALL: 0.9, TRAP: 0.9, FIRE_ATTACK: 0.8, AMBUSH: 1.5, FALSE_RETREAT: 1.1, FLANK: 0.9, BURN_GRANARY: 0.9 },
};
export class BattleStratagemManager {
    constructor() {
        this.activeEffects = new Map();
        this.effectIdCounter = 0;
    }
    getStratagem(type) {
        return { ...STRATAGEMS[type] };
    }
    getAllStratagems() {
        return Object.values(STRATAGEMS).map(s => ({ ...s }));
    }
    /** 사용 가능 계략 목록 (지력 기반) */
    getAvailableStratagems(officerId, intelligence, spirit) {
        const unlocked = [];
        if (intelligence >= 30)
            unlocked.push('ROCKFALL', 'AMBUSH', 'FLANK');
        if (intelligence >= 50)
            unlocked.push('TRAP', 'FIRE_ATTACK');
        if (intelligence >= 70)
            unlocked.push('FALSE_RETREAT');
        if (intelligence >= 85)
            unlocked.push('BURN_GRANARY');
        return unlocked
            .map(t => STRATAGEMS[t])
            .filter(s => s.spiritCost <= spirit);
    }
    /** 계략 성공률 계산 */
    calculateSuccessRate(stratagemType, intelligence, weather) {
        const baseRate = intelligence / 100;
        const stratagem = STRATAGEMS[stratagemType];
        const complexityPenalty = (stratagem.spiritCost - 1) * 0.1;
        const weatherMod = WEATHER_EFFECT[weather]?.[stratagemType] ?? 1.0;
        return Math.max(0.1, Math.min(0.95, (baseRate - complexityPenalty) * weatherMod));
    }
    /** 계략 실행 */
    executeStratagem(stratagemType, executorId, targetTile, intelligence, weather, targetMorale) {
        const stratagem = STRATAGEMS[stratagemType];
        const successRate = this.calculateSuccessRate(stratagemType, intelligence, weather);
        const success = Math.random() < successRate;
        const effectId = `strat_${this.effectIdCounter++}`;
        let damageApplied = 0;
        let moraleDamage = 0;
        if (success) {
            damageApplied = stratagem.damage;
            moraleDamage = stratagemType === 'BURN_GRANARY' ? 10 : 0;
            if (stratagem.duration > 0) {
                this.activeEffects.set(effectId, {
                    stratagem, executorId, targetTile, success: true,
                    damageApplied, durationRemaining: stratagem.duration, moraleDamage,
                });
            }
        }
        return { stratagem, executorId, targetTile, success, damageApplied, durationRemaining: stratagem.duration, moraleDamage };
    }
    /** 매 턴 지속 효과 처리 */
    processActiveEffects(unitPositions) {
        const expired = [];
        const activeDamage = [];
        for (const [id, effect] of this.activeEffects) {
            if (effect.durationRemaining <= 0) {
                expired.push(id);
                continue;
            }
            const updated = {
                ...effect,
                damageApplied: effect.damageApplied,
                durationRemaining: effect.durationRemaining - 1,
            };
            this.activeEffects.set(id, updated);
            activeDamage.push(updated);
            if (updated.durationRemaining <= 0) {
                expired.push(id);
            }
        }
        for (const id of expired) {
            this.activeEffects.delete(id);
        }
        return activeDamage;
    }
    /** 포위망 확인 (주변 6타일이 적에게 점령됨) */
    checkEncircled(unitCoord, enemyTiles, radius = 1) {
        const neighbors = this.getNeighborCoords(unitCoord);
        const enemySet = new Set(enemyTiles.map(t => `${t.q},${t.r}`));
        let surrounded = 0;
        for (const n of neighbors) {
            if (enemySet.has(`${n.q},${n.r}`))
                surrounded++;
        }
        return surrounded >= radius * 4; // 6타일 중 4개 이상이 적이면 포위
    }
    getNeighborCoords(coord) {
        const dirs = [
            { q: 1, r: 0 }, { q: -1, r: 0 }, { q: 1, r: -1 },
            { q: 0, r: 1 }, { q: 0, r: -1 }, { q: -1, r: 1 },
        ];
        return dirs.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
    }
    getActiveEffects() {
        return Array.from(this.activeEffects.values());
    }
    clear() {
        this.activeEffects.clear();
        this.effectIdCounter = 0;
    }
}
//# sourceMappingURL=battle_stratagem_system.js.map