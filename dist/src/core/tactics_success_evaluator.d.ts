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
export declare class TacticsSuccessEvaluator {
    evaluate(context: TacticsContext, rng: Xoshiro128): boolean;
}
//# sourceMappingURL=tactics_success_evaluator.d.ts.map