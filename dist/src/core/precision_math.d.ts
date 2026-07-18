export declare class PrecisionMath {
    static add(a: number, b: number): number;
    static sub(a: number, b: number): number;
    static mul(a: number, b: number): number;
    static div(a: number, b: number): number;
    static clamp(value: number, min: number, max: number): number;
    static lerp(a: number, b: number, t: number): number;
    static roundTo(value: number, decimals: number): number;
    static floorTo(value: number, decimals: number): number;
    static ceilTo(value: number, decimals: number): number;
    static percentage(value: number, total: number): number;
    static ratio(value: number, total: number): number;
    static weightedRandom(weights: number[]): number;
    static normalizeArray(values: number[]): number[];
    static gaussianRandom(mean?: number, stdDev?: number): number;
    private static decimalPlaces;
}
export declare class StatCalculator {
    static calculateGrowth(base: number, exp: number, maxLevel: number): number;
    static battleDamage(attack: number, defense: number, multiplier: number, randomness?: number): number;
    static recruitmentCost(soldiers: number, baseCost: number): number;
    static populationGrowth(current: number, max: number, stability: number): number;
}
//# sourceMappingURL=precision_math.d.ts.map