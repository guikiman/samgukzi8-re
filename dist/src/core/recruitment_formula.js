export function calculateRecruitmentChance(ctx) {
    const breakdown = [];
    const affinityFactor = ctx.affinity / 100;
    breakdown.push({ factor: "affinity", weight: 0.3, contribution: affinityFactor * 0.3 });
    const charismaFactor = ctx.recruiterCharisma / 100;
    breakdown.push({ factor: "charisma", weight: 0.2, contribution: charismaFactor * 0.2 });
    const loyaltyPenalty = ctx.targetLoyalty / 100;
    const loyaltyFactor = 1 - loyaltyPenalty;
    breakdown.push({ factor: "loyalty_penalty", weight: -0.2, contribution: loyaltyPenalty * -0.2 });
    const ambitionFactor = ctx.targetAmbition / 100;
    breakdown.push({ factor: "ambition", weight: 0.15, contribution: ambitionFactor * 0.15 });
    const powerRatio = ctx.recruiterFactionPower / Math.max(1, ctx.currentFactionPower);
    const powerFactor = Math.min(2, powerRatio);
    breakdown.push({ factor: "power_ratio", weight: 0.1, contribution: (powerFactor - 1) * 0.1 });
    const giftFactor = ctx.giftBonus / 100;
    breakdown.push({ factor: "gift_bonus", weight: 0.1, contribution: giftFactor * 0.1 });
    const personalityModifiers = {
        AGGRESSIVE: 0.05,
        AMBITIOUS: 0.1,
        GREEDY: 0.08,
        LOYAL: -0.1,
        RIGHTEOUS: 0.0,
        CALM: 0.03,
        CAUTIOUS: -0.02,
        TIMID: -0.05,
    };
    const personalityFactor = personalityModifiers[ctx.targetPersonality] ?? 0;
    breakdown.push({ factor: "personality", weight: 0.05, contribution: personalityFactor * 0.05 });
    let totalChance = breakdown.reduce((s, b) => s + b.contribution, 0);
    if (ctx.hasSwornBrotherhood)
        totalChance += 0.2;
    if (ctx.isRival)
        totalChance -= 0.3;
    return { chance: Math.max(0, Math.min(0.95, totalChance)), breakdown };
}
export function calculateDetectChance(intelligence, spymaster) {
    const base = 0.1 + (spymaster.intelligence / 200);
    const intDiff = (spymaster.intelligence - intelligence) / 100;
    return Math.max(0.05, Math.min(0.95, base + intDiff));
}
export function generateRecruitmentEvent(success, targetName, recruiterName) {
    if (success) {
        return {
            message: `${targetName}이(가) ${recruiterName}의 등용 제의를 받아들였다!`,
            type: "success",
        };
    }
    const fails = [
        `${targetName}이(가) 등용 제의를 거절했다.`,
        `${targetName}: "충성을 저버릴 수 없소."`,
        `${targetName}이(가) 분노하며 제안을 일축했다.`,
    ];
    return {
        message: fails[Math.floor(Math.random() * fails.length)],
        type: Math.random() < 0.2 ? "critical_failure" : "failure",
    };
}
//# sourceMappingURL=recruitment_formula.js.map