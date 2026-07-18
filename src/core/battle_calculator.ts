/**
 * [Task 24] 실시간 전투 공식 계산기 (Battle Calculator) 샌드박스
 *
 * 공격력, 방어력, 지형 효과를 수치 대입하여 최종 데미지 가공.
 */

export interface BattleStats {
  readonly attack: number;
  readonly defense: number;
  readonly troopCount: number;
  readonly morale: number;
  readonly terrainBonus: number;
  readonly affinity: number;
}

export interface BattleResult {
  readonly damage: number;
  readonly defenderRemaining: number;
  readonly moraleLoss: number;
}

export class BattleCalculator {
  calculate(attacker: BattleStats, defender: BattleStats): BattleResult {
    const baseDamage = Math.max(
      1,
      Math.floor(
        (attacker.attack * attacker.troopCount * (attacker.morale / 100)) /
          Math.max(defender.defense, 1),
      ),
    );

    const terrainModifier = 1 + (attacker.terrainBonus - defender.terrainBonus) * 0.1;
    const affinityModifier = 1 + (attacker.affinity - defender.affinity) * 0.05;
    const finalDamage = Math.floor(baseDamage * terrainModifier * affinityModifier);
    const actualDamage = Math.min(finalDamage, defender.troopCount);
    const defenderRemaining = defender.troopCount - actualDamage;
    const moraleLoss = Math.floor((actualDamage / Math.max(defender.troopCount, 1)) * 20);

    return { damage: actualDamage, defenderRemaining, moraleLoss };
  }
}
