/**
 * [295] 유저 비개입 자동 전투 시뮬레이터 — Auto Battle Simulator
 *
 * Python 원본: src/systems/battle_engine.py → TypeScript 포팅 + 확장
 *
 * 설계 스펙:
 * - [295] 유저 비개입 전투 발생 시 0.1초 내 시뮬레이션 결과 도출
 * - Python battle_engine.py의 고저차 보정(elevation bonus) / 보급선 단절 사기 붕괴 이식
 * - 병력·사기·훈련·통솔 가중 종합 전투력 산출 → 라운드별 소모전 해결
 * - 지형 방어 보정, 크리티컬(무력 격차), 도시 방어막 반영
 * - 결과는 전투 리플레이 [312] 및 연대기 [441-460]에 사용 가능한 로그 형태
 */
// ============================================================
// 2. 전투 상수 — Python battle_engine.py 배율 이식
// ============================================================
/** 고지대에서 저지대 공격 시 대미지 보정 (Python: 1.2) */
const ELEVATION_BONUS = 1.2;
/** 고저차 보정 발동 최소 고도 차 */
const ELEVATION_THRESHOLD = 10;
/** 보급 단절 시 라운드당 사기 감소 (Python: 10) */
const SUPPLY_CUT_MORALE_HIT = 10;
/** 성 방어막 — 공격자 대미지 감소율 */
const CITY_WALL_DAMAGE_REDUCTION = 0.25;
/** 지형별 방어 보정 (받는 대미지 감소율) */
const TERRAIN_DEFENSE = {
    PLAIN: 0,
    FOREST: 0.1,
    MOUNTAIN: 0.2,
    RIVER: 0.05,
    CITY_WALL: 0.3,
};
/** 최대 라운드 — 초과 시 방어자 승리 (공격 실패) */
const MAX_ROUNDS = 12;
/** 크리티컬 기본 확률 — 무력 격차로 가변 */
const CRITICAL_BASE_CHANCE = 0.08;
/** 크리티컬 대미지 배율 */
const CRITICAL_MULTIPLIER = 1.5;
// ============================================================
// 4. 핵심 시뮬레이터
// ============================================================
/** 전투력 = 병력 × (사기/50) × (훈련/50) × (1 + 통솔/200) */
export function computeCombatPower(unit) {
    const moraleFactor = Math.max(0.1, unit.morale / 50);
    const trainingFactor = Math.max(0.2, unit.training / 50);
    const leadershipFactor = 1 + unit.leadership / 200;
    return unit.soldiers * moraleFactor * trainingFactor * leadershipFactor;
}
/** 단일 라운드 대미지 — 병력 기반 + 지형/고저차/성벽 보정 */
function computeRoundDamage(attacker, defender, attackerTile, defenderTile, siege) {
    // Python: base_dmg = soldiers // 10
    let damage = Math.max(1, Math.floor(attacker.soldiers / 10));
    // 사기/훈련 보정
    damage = Math.floor(damage * (0.5 + attacker.morale / 100) * (0.7 + attacker.training / 200));
    // Python: 고저차 보정 — 공격자가 고지대(MOUNTAIN 또는 elevation > 10)일 때 ×1.2
    if (attackerTile) {
        const highGround = attackerTile.terrain === 'MOUNTAIN' ||
            (defenderTile !== undefined &&
                attackerTile.elevation - defenderTile.elevation > ELEVATION_THRESHOLD);
        if (highGround)
            damage = Math.floor(damage * ELEVATION_BONUS);
    }
    // 방어자 지형 보정 — 받는 대미지 감소
    if (defenderTile && TERRAIN_DEFENSE[defenderTile.terrain] > 0) {
        damage = Math.floor(damage * (1 - TERRAIN_DEFENSE[defenderTile.terrain]));
    }
    // 성 방어막 — 공성 시 공격자 대미지 감소
    if (siege) {
        damage = Math.floor(damage * (1 - CITY_WALL_DAMAGE_REDUCTION));
    }
    // 크리티컬 — 무력 격차 기반 가변 확률
    const mightGap = attacker.might - defender.might;
    const critChance = Math.min(0.35, Math.max(0.02, CRITICAL_BASE_CHANCE + mightGap / 500));
    const critical = Math.random() < critChance;
    if (critical)
        damage = Math.floor(damage * CRITICAL_MULTIPLIER);
    return { damage: Math.max(1, damage), critical };
}
/** 보급선 단절 검사 — 적 진영이 두 유닛 사이를 완전히 가로막는지 (Python BFS 축약: 인접 봉쇄) */
export function isSupplyCut(unitPos, friendlyBase, enemyPositions) {
    // 자동 판정용 경량 규칙: 유닛의 6방향 인접 헥스가 모두 적군이면 단절로 간주
    // (전투 맵 전체 BFS는 battle_calculations.ts isSupplyLineCut이 담당)
    void friendlyBase;
    if (enemyPositions.length === 0)
        return false;
    const enemySet = new Set(enemyPositions.map(p => `${p.q},${p.r}`));
    const dirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    let blockedCount = 0;
    let inBounds = 0;
    for (const [dq, dr] of dirs) {
        const key = `${unitPos.q + dq},${unitPos.r + dr}`;
        if (enemySet.has(key)) {
            blockedCount++;
            inBounds++;
        }
    }
    // 6방향 중 4방향 이상 적군에 포위되면 보급 단절 판정
    return inBounds >= 4 && blockedCount >= 4;
}
/**
 * [295] 자동 전투 시뮬레이션 — 유저 비개입 전투를 라운드제 소모전으로 즉시 해결.
 * 성능 목표: 1,000회 연속 호출 기준 0.1초 내 완료 (라운드 ≤ 12의 O(1) 연산).
 */
export function simulateAutoBattle(sides) {
    const attacker = { ...sides.attacker };
    const defender = { ...sides.defender };
    const roundLogs = [];
    let round = 0;
    while (round < MAX_ROUNDS &&
        attacker.soldiers > 0 && defender.soldiers > 0 &&
        attacker.morale > 0 && defender.morale > 0) {
        round++;
        // 보급 단절 사기 붕괴 (Python process_turn 이식)
        if (!attacker.isSupplied) {
            attacker.morale = Math.max(0, attacker.morale - SUPPLY_CUT_MORALE_HIT);
        }
        if (!defender.isSupplied) {
            defender.morale = Math.max(0, defender.morale - SUPPLY_CUT_MORALE_HIT);
        }
        let note;
        if (!attacker.isSupplied || !defender.isSupplied) {
            note = '보급 단절 — 사기 붕괴';
        }
        // 동시 교전 — 전투력 비례 대미지 + 고정 소모전
        const atk = computeRoundDamage(attacker, defender, sides.attackerTile, sides.defenderTile, sides.siege);
        const def = computeRoundDamage(defender, attacker, sides.defenderTile, sides.attackerTile, false);
        const criticals = [];
        if (atk.critical)
            criticals.push({ side: 'attacker', who: attacker.commanderName });
        if (def.critical)
            criticals.push({ side: 'defender', who: defender.commanderName });
        // 사망자 처리 — 동시 적용
        const attackerLoss = Math.min(attacker.soldiers, def.damage);
        const defenderLoss = Math.min(defender.soldiers, atk.damage);
        attacker.soldiers -= attackerLoss;
        defender.soldiers -= defenderLoss;
        // 피해 비례 사기 감소
        attacker.morale = Math.max(0, attacker.morale - Math.floor(attackerLoss / 200));
        defender.morale = Math.max(0, defender.morale - Math.floor(defenderLoss / 200));
        roundLogs.push({
            round,
            attackerDamage: atk.damage,
            defenderDamage: def.damage,
            attackerSoldiersAfter: attacker.soldiers,
            defenderSoldiersAfter: defender.soldiers,
            criticals,
            note,
        });
    }
    // 승패 판정 — 병력 우위, 동률 시 방어자(공격 실패)
    const winner = attacker.soldiers > defender.soldiers && attacker.soldiers > 0 ? 'attacker' : 'defender';
    const totalCasualties = (sides.attacker.soldiers - Math.max(0, attacker.soldiers)) +
        (sides.defender.soldiers - Math.max(0, defender.soldiers));
    const summary = winner === 'attacker'
        ? `${attacker.commanderName}이(가) ${round}라운드 만에 ${defender.commanderName}을(를) 격파했다 (피해 ${sides.attacker.soldiers - attacker.soldiers}/${sides.attacker.soldiers})`
        : `${defender.commanderName}이(가) ${attacker.commanderName}의 공세를 막아냈다 (${round}라운드, 공격측 피해 ${sides.attacker.soldiers - attacker.soldiers}/${sides.attacker.soldiers})`;
    return {
        winner,
        rounds: round,
        attackerRemaining: Math.max(0, attacker.soldiers),
        defenderRemaining: Math.max(0, defender.soldiers),
        totalCasualties,
        roundLogs,
        summary,
    };
}
/**
 * 전투력 비교 즉시 판정 — 더 가벼운 판정이 필요할 때 (외교/모의 전투 등).
 * 전투력 비율 + 난수로 단판 승부.
 */
export function resolveInstantBattle(sides) {
    const atkPower = computeCombatPower(sides.attacker);
    const defPower = computeCombatPower(sides.defender) * (sides.siege ? 1.3 : 1);
    const atkWinProb = atkPower / (atkPower + defPower);
    const winner = Math.random() < atkWinProb ? 'attacker' : 'defender';
    const attackerLossRate = winner === 'attacker' ? 0.12 : 0.3;
    const defenderLossRate = winner === 'attacker' ? 0.3 : 0.12;
    return {
        winner,
        rounds: 1,
        attackerRemaining: Math.floor(sides.attacker.soldiers * (1 - attackerLossRate)),
        defenderRemaining: Math.floor(sides.defender.soldiers * (1 - defenderLossRate)),
        totalCasualties: Math.floor(sides.attacker.soldiers * attackerLossRate + sides.defender.soldiers * defenderLossRate),
        roundLogs: [],
        summary: winner === 'attacker'
            ? `${sides.attacker.commanderName}의 기습이 성공했다`
            : `${sides.defender.commanderName}이(가) 방어에 성공했다`,
    };
}
//# sourceMappingURL=auto_battle_simulator.js.map