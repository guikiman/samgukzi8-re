const PRECISION = 1e-10;
export class PrecisionMath {
    static add(a, b) {
        const factor = Math.pow(10, Math.max(this.decimalPlaces(a), this.decimalPlaces(b)));
        return Math.round(a * factor + b * factor) / factor;
    }
    static sub(a, b) {
        return this.add(a, -b);
    }
    static mul(a, b) {
        const factor = Math.pow(10, Math.max(this.decimalPlaces(a), this.decimalPlaces(b)));
        return Math.round(a * factor * b) / factor;
    }
    static div(a, b) {
        if (Math.abs(b) < PRECISION)
            return 0;
        return this.mul(a, 1 / b);
    }
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    static lerp(a, b, t) {
        return a + (b - a) * this.clamp(t, 0, 1);
    }
    static roundTo(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }
    static floorTo(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.floor(value * factor) / factor;
    }
    static ceilTo(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.ceil(value * factor) / factor;
    }
    static percentage(value, total) {
        if (Math.abs(total) < PRECISION)
            return 0;
        return this.roundTo((value / total) * 100, 2);
    }
    static ratio(value, total) {
        if (Math.abs(total) < PRECISION)
            return 0;
        return this.roundTo(value / total, 4);
    }
    static weightedRandom(weights) {
        const total = weights.reduce((s, w) => s + w, 0);
        if (total <= 0)
            return 0;
        let roll = Math.random() * total;
        for (let i = 0; i < weights.length; i++) {
            roll -= weights[i];
            if (roll <= 0)
                return i;
        }
        return weights.length - 1;
    }
    static normalizeArray(values) {
        const max = Math.max(...values, 1);
        return values.map((v) => v / max);
    }
    static gaussianRandom(mean = 0, stdDev = 1) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + z0 * stdDev;
    }
    static decimalPlaces(n) {
        if (!isFinite(n))
            return 0;
        const str = String(n);
        const dot = str.indexOf(".");
        return dot === -1 ? 0 : str.length - dot - 1;
    }
}
export class StatCalculator {
    static calculateGrowth(base, exp, maxLevel) {
        const level = Math.min(maxLevel, Math.floor(exp / 100) + 1);
        return Math.min(100, base + level * 2);
    }
    static battleDamage(attack, defense, multiplier, randomness = 0.1) {
        const base = Math.max(1, attack - defense * 0.5);
        const variance = 1 + (Math.random() - 0.5) * 2 * randomness;
        return Math.round(base * multiplier * variance);
    }
    static recruitmentCost(soldiers, baseCost) {
        return Math.round(soldiers * baseCost * (1 + soldiers / 10000));
    }
    static populationGrowth(current, max, stability) {
        const growthRate = 0.01 + (stability / 100) * 0.02;
        const capacityFactor = 1 - current / Math.max(1, max);
        return Math.max(0, Math.floor(current * growthRate * capacityFactor));
    }
}
//# sourceMappingURL=precision_math.js.map