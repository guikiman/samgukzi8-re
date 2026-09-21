/**
 * [Phase 3] 전장 UI 프론트엔드 — BattleFrontend
 *
 * 헥스 전장 렌더링 + 유닛 배치 + 전투 UI 통합.
 * 기존 battle_calculations.ts의 BattleUnit/BattleTile 활용.
 */
// ============================================================
// BattleFrontend
// ============================================================
export class BattleFrontend {
    constructor(renderer) {
        this.deployableUnits = [];
        // Unit rendering cache
        this.UNIT_COLORS = {
            INFANTRY: '#4488cc',
            CAVALRY: '#cc8844',
            ARCHER: '#44cc88',
            SIEGE: '#8844cc',
        };
        this.renderer = renderer;
        this.state = this.createEmptyState();
    }
    createEmptyState() {
        return {
            phase: 'DEPLOYMENT',
            turn: 1,
            currentUnitIndex: 0,
            units: [],
            tiles: [],
            selectedUnitId: null,
            hoveredHex: null,
            moveRange: [],
            attackRange: [],
            actionLog: [],
            highlightedPath: [],
        };
    }
    // ============================================================
    // Initialization
    // ============================================================
    initBattle(tiles, friendlyUnits) {
        this.state = this.createEmptyState();
        this.state.tiles = tiles;
        this.state.phase = 'DEPLOYMENT';
        this.deployableUnits = friendlyUnits.map(u => ({ ...u }));
        this.state.actionLog.push('배치 페이즈: 유닛을 전장에 배치하세요');
        this.onPhaseChange?.('DEPLOYMENT');
    }
    setCallbacks(cbs) {
        this.onPhaseChange = cbs.onPhaseChange;
        this.onAction = cbs.onAction;
    }
    // ============================================================
    // Unit Deployment
    // ============================================================
    getDeployableUnits() {
        return this.deployableUnits;
    }
    deployUnit(unitId, q, r) {
        const unit = this.deployableUnits.find(u => u.unitId === unitId && !u.deployed);
        if (!unit)
            return false;
        // Check if hex is occupied
        const occupied = this.state.units.find(u => u.position.q === q && u.position.r === r);
        if (occupied)
            return false;
        unit.deployed = true;
        unit.deployedAt = { q, r };
        // Convert deployable to battle unit
        const battleUnit = {
            unitId: unit.unitId,
            officerId: unit.unitId,
            unitType: unit.unitType,
            soldiers: unit.soldiers,
            morale: unit.morale,
            training: 70,
            position: { q, r },
            facing: 0,
            isSupplied: true,
            baseAttack: 80,
            baseDefense: 70,
            movementPoints: 5,
            maxMovementPoints: 5,
            hasEvasionSkill: false,
            evasionProbability: 0.1,
        };
        this.state.units.push(battleUnit);
        this.state.actionLog.push(`${unit.officerName} ($unit.unitType) 배치 완료 — 헥스 ($q,$r)`);
        this.onAction?.('deploy');
        return true;
    }
    startBattle() {
        if (this.state.units.length === 0)
            return;
        this.state.phase = 'PLAYER_TURN';
        this.state.turn = 1;
        this.state.currentUnitIndex = 0;
        this.state.actionLog.push('전투 시작! 아군 턴');
        this.onPhaseChange?.('PLAYER_TURN');
    }
    // ============================================================
    // Hex Interaction
    // ============================================================
    handleHexClick(q, r) {
        if (this.state.phase === 'DEPLOYMENT')
            return;
        const unit = this.state.units.find(u => u.position.q === q && u.position.r === r);
        if (unit && unit.unitId.startsWith('friendly_')) {
            this.selectUnit(unit.unitId);
            return;
        }
        // If a unit is selected, try to move/attack
        if (this.state.selectedUnitId) {
            const selected = this.state.units.find(u => u.unitId === this.state.selectedUnitId);
            if (!selected)
                return;
            const inMoveRange = this.state.moveRange.some(m => m.q === q && m.r === r);
            if (inMoveRange) {
                this.moveUnit(selected.unitId, q, r);
                return;
            }
            const inAttackRange = this.state.attackRange.some(a => a.q === q && a.r === r);
            if (inAttackRange) {
                this.attackUnit(selected.unitId, q, r);
                return;
            }
        }
    }
    handleHexHover(q, r) {
        this.state.hoveredHex = { q, r };
        this.renderer.setHoveredHex({ q, r });
    }
    // ============================================================
    // Unit Actions
    // ============================================================
    selectUnit(unitId) {
        const unit = this.state.units.find(u => u.unitId === unitId);
        if (!unit)
            return;
        this.state.selectedUnitId = unitId;
        this.state.moveRange = this.calcMoveRange(unit);
        this.state.attackRange = this.calcAttackRange(unit);
        this.state.actionLog.push(`유닛 선택: ${unit.officerId} (병종:$unit.unitType, 사기:$unit.morale)`);
    }
    moveUnit(unitId, q, r) {
        const unit = this.state.units.find(u => u.unitId === unitId);
        if (!unit)
            return false;
        const cost = Math.abs(q - unit.position.q) + Math.abs(r - unit.position.r);
        if (cost > unit.movementPoints)
            return false;
        unit.position = { q, r };
        unit.movementPoints -= cost;
        this.state.moveRange = [];
        this.state.attackRange = [];
        this.state.actionLog.push(`유닛 이동 → 헥스 ($q,$r) (AP: $unit.movementPoints)`);
        this.onAction?.('move');
        return true;
    }
    attackUnit(attackerId, targetQ, targetR) {
        const attacker = this.state.units.find(u => u.unitId === attackerId);
        const defender = this.state.units.find(u => u.position.q === targetQ && u.position.r === targetR);
        if (!attacker || !defender)
            return;
        const damage = Math.floor((attacker.baseAttack * attacker.soldiers) /
            (defender.baseDefense * Math.max(1, defender.soldiers)) * 10);
        const killed = Math.min(defender.soldiers, Math.floor(damage * (0.5 + Math.random() * 0.5)));
        defender.soldiers -= killed;
        defender.morale = Math.max(0, defender.morale - 5);
        this.state.actionLog.push(`⚔️ 공격! $killed명 격파 (남은 병력: $defender.soldiers, 사기: $defender.morale)`);
        this.state.selectedUnitId = null;
        this.state.moveRange = [];
        this.state.attackRange = [];
        this.onAction?.('attack');
        if (defender.soldiers <= 0) {
            this.state.actionLog.push(`💀 유닛 ${defender.unitId} 궤멸!`);
            this.state.units = this.state.units.filter(u => u.unitId !== defender.unitId);
        }
    }
    endTurn() {
        const enemyAlive = this.state.units.some(u => !u.unitId.startsWith('friendly_'));
        const friendlyAlive = this.state.units.some(u => u.unitId.startsWith('friendly_'));
        if (!enemyAlive || !friendlyAlive) {
            this.state.phase = 'RESULT';
            const winner = enemyAlive ? '적군' : '아군';
            this.state.actionLog.push(`🏆 ${winner} 승리!`);
            this.onPhaseChange?.('RESULT');
            return;
        }
        this.state.phase = this.state.phase === 'PLAYER_TURN' ? 'ENEMY_TURN' : 'PLAYER_TURN';
        this.state.turn += this.state.phase === 'PLAYER_TURN' ? 1 : 0;
        this.state.currentUnitIndex = 0;
        this.state.selectedUnitId = null;
        this.state.moveRange = [];
        this.state.attackRange = [];
        this.state.actionLog.push(`턴 ${this.state.turn} — ${this.state.phase === 'PLAYER_TURN' ? '아군' : '적군'} 턴`);
        this.onPhaseChange?.(this.state.phase);
        // Auto-resolve enemy turn
        if (this.state.phase === 'ENEMY_TURN') {
            this.resolveEnemyTurn();
            this.endTurn();
        }
    }
    resolveEnemyTurn() {
        const enemies = this.state.units.filter(u => !u.unitId.startsWith('friendly_'));
        const friendlies = this.state.units.filter(u => u.unitId.startsWith('friendly_'));
        for (const enemy of enemies) {
            if (enemy.soldiers <= 0)
                continue;
            // Find nearest friendly
            let nearest = null;
            let minDist = Infinity;
            for (const f of friendlies) {
                if (f.soldiers <= 0)
                    continue;
                const d = Math.abs(enemy.position.q - f.position.q) + Math.abs(enemy.position.r - f.position.r);
                if (d < minDist) {
                    minDist = d;
                    nearest = f;
                }
            }
            if (nearest && minDist <= 2) {
                // Attack nearest
                const dmg = Math.floor((enemy.baseAttack * enemy.soldiers) /
                    (nearest.baseDefense * Math.max(1, nearest.soldiers)) * 8);
                const killed = Math.min(nearest.soldiers, Math.floor(dmg * (0.3 + Math.random() * 0.4)));
                nearest.soldiers -= killed;
                this.state.actionLog.push(`⚔️ 적군 공격! 아군 $killed명 피해 (남은 병력: $nearest.soldiers)`);
            }
            else if (nearest) {
                // Move toward nearest
                const dq = Math.sign(nearest.position.q - enemy.position.q);
                const dr = Math.sign(nearest.position.r - enemy.position.r);
                enemy.position = { q: enemy.position.q + dq, r: enemy.position.r + dr };
            }
        }
    }
    // ============================================================
    // Range Calculations
    // ============================================================
    calcMoveRange(unit) {
        const range = [];
        const maxDist = unit.movementPoints;
        for (let dq = -maxDist; dq <= maxDist; dq++) {
            for (let dr = -maxDist; dr <= maxDist; dr++) {
                const ds = -dq - dr;
                if (Math.abs(ds) > maxDist)
                    continue;
                const cost = Math.abs(dq) + Math.abs(dr);
                if (cost > maxDist)
                    continue;
                const q = unit.position.q + dq;
                const r = unit.position.r + dr;
                const occupied = this.state.units.some(u => u.unitId !== unit.unitId && u.position.q === q && u.position.r === r);
                if (!occupied)
                    range.push({ q, r });
            }
        }
        return range;
    }
    calcAttackRange(unit) {
        const range = [];
        const dirs = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
        for (const [dq, dr] of dirs) {
            const q = unit.position.q + dq;
            const r = unit.position.r + dr;
            const enemy = this.state.units.some(u => u.unitId !== unit.unitId && u.position.q === q && u.position.r === r);
            if (enemy)
                range.push({ q, r });
        }
        return range;
    }
    // ============================================================
    // Canvas Rendering
    // ============================================================
    getState() {
        return this.state;
    }
    render(ctx, width, height) {
        if (!this.state.tiles.length)
            return;
        // Phase overlay
        this.renderPhaseOverlay(ctx);
    }
    renderPhaseOverlay(ctx) {
        // Phase indicator at top center
        const phaseNames = {
            DEPLOYMENT: '⚔️ 배치 페이즈',
            PLAYER_TURN: '🎯 아군 턴',
            ENEMY_TURN: '👹 적군 턴',
            RESULT: '🏆 전투 종료',
        };
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, 250, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Malgun Gothic", sans-serif';
        ctx.fillText(phaseNames[this.state.phase] + ` (턴 ${this.state.turn})`, 10, 20);
        // Unit count
        const friendly = this.state.units.filter(u => u.unitId.startsWith('friendly_')).length;
        const enemy = this.state.units.filter(u => !u.unitId.startsWith('friendly_')).length;
        ctx.fillText(`아군: ${friendly} | 적군: ${enemy}`, 10, 42);
    }
}
//# sourceMappingURL=battle_frontend.js.map