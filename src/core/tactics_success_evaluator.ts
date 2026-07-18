/**
 * [Task 25] 전법(Tactics) 및 계략(Strategy) 성공률 판정 연산 블록
 *
 * 무장 지력, 난수 값, 우호도 체인 요소를 종합 반영해
 * 성공 여부를 결정하는 확률 판정기.
 */

import { Xoshiro128 } from "./prng_xoshiro";

export interface TacticsContext {
  readonly casterIntel: number;
  readonly targetIntelligence: number;
  readonly relationshipBonus: number;
  readonly difficulty: number;
}

export class TacticsSuccessEvaluator {
  evaluate(context: TacticsContext, rng: Xoshiro128): boolean {
    const baseChance = 0.5;
    const intelDiff = (context.casterIntel - context.targetIntelligence) * 0.02;
    const relationMod = context.relationshipBonus * 0.05;
    const diffMod = -context.difficulty * 0.1;
    const finalChance = Math.max(0.05, Math.min(0.95, baseChance + intelDiff + relationMod + diffMod));
    return rng.float() < finalChance;
  }
}
