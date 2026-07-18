/**
 * [B5] 수역 강제 표류 및 유격 데미지 — Naval Drift Engine
 *
 * NavalDriftEngine:
 *   1. 매 턴 종료 시 수상 모드 유닛을 driftVector 방향으로 강제 1칸 이동
 *   2. 목표 타일이 WATER가 아니거나 점유된 경우 충돌 데미지 적용
 *   3. 충돌 시 사기 -10, 병력 8~10% 손실
 */
import { HexNavalStateResolver } from './hex_naval_state_resolver';
export class NavalDriftEngine {
    constructor() {
        this.navalResolver = new HexNavalStateResolver();
    }
    /**
     * 매 턴 종료 시 수상에 있는 모든 유닛을 강의 흐름에 따라 강제 이동시킵니다.
     */
    processTurnEndDrift(units, grid) {
        const results = [];
        for (const [, unit] of units) {
            if (!unit.isNavalMode)
                continue;
            const currentKey = `${unit.x},${unit.y},${unit.z}`;
            const tile = grid.get(currentKey);
            if (!tile || tile.type !== 'WATER' || !tile.driftVector)
                continue;
            const { dx, dy, dz } = tile.driftVector;
            const targetX = unit.x + dx;
            const targetY = unit.y + dy;
            const targetZ = unit.z + dz;
            const targetKey = `${targetX},${targetY},${targetZ}`;
            const targetTile = grid.get(targetKey);
            const isOccupied = Array.from(units.values()).some(u => u.id !== unit.id && u.x === targetX && u.y === targetY);
            if (!targetTile || targetTile.type !== 'WATER' || isOccupied) {
                const blockedBy = !targetTile ? 'BOUNDS'
                    : targetTile.type !== 'WATER' ? 'LAND'
                        : 'UNIT';
                const result = this.applyCollisionDamage(unit);
                results.push(result);
            }
            else {
                unit.x = targetX;
                unit.y = targetY;
                unit.z = targetZ;
                this.navalResolver.resolveTileEntry(unit, targetTile);
                results.push({
                    unitId: unit.id,
                    collision: false,
                    soldiersLost: 0,
                    moraleLost: 0,
                    blockedBy: null,
                });
            }
        }
        return results;
    }
    applyCollisionDamage(unit) {
        const maxSoldiers = 1000; // 추상화: 유닛 최대 병력
        const soldiersLost = Math.floor(maxSoldiers * (0.08 + Math.random() * 0.02));
        const moraleLost = 10;
        unit.morale = Math.max(0, unit.morale - moraleLost);
        unit.conditions = [...unit.conditions.filter(c => c !== 'CONFUSED'), 'CONFUSED'];
        return {
            unitId: unit.id,
            collision: true,
            soldiersLost,
            moraleLost,
            blockedBy: 'LAND',
        };
    }
}
//# sourceMappingURL=naval_drift_engine.js.map