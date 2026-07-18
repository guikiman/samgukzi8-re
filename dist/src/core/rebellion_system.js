export class RebellionSystem {
    evaluateRebellion(ctx) {
        const baseDiscontent = this.calculateDiscontent(ctx);
        const roll = Math.random() * 100;
        if (baseDiscontent > 70 && roll < baseDiscontent) {
            if (ctx.officerRank === 1 && ctx.isGovernor && ctx.officerAmbition > 80) {
                return {
                    occurs: true, type: "usurp",
                    confidence: baseDiscontent,
                    description: `${ctx.officerId}이(가) 수도를 장악하고 스스로 군주가 되었다!`,
                };
            }
            if (ctx.garrisonUnderCommand > 5000 && ctx.factionStability < 40) {
                return {
                    occurs: true, type: "defect",
                    confidence: baseDiscontent,
                    description: `${ctx.officerId}이(가) 휘하 병력을 이끌고 적국으로 투항했다!`,
                };
            }
            return {
                occurs: true, type: "independence",
                confidence: baseDiscontent,
                description: `${ctx.officerId}이(가) ${ctx.ownsCity}에서 독립을 선언했다!`,
            };
        }
        return { occurs: false, type: "none", confidence: baseDiscontent, description: "반란 징후 없음" };
    }
    calculateDiscontent(ctx) {
        let discontent = 0;
        discontent += (100 - ctx.officerLoyalty) * 0.3;
        discontent += ctx.officerAmbition * 0.25;
        discontent += (100 - ctx.factionStability) * 0.2;
        if (ctx.isGovernor)
            discontent += 10;
        if (ctx.officerRank <= 3)
            discontent += 15;
        const personalityMods = {
            AMBITIOUS: 15, AGGRESSIVE: 10, GREEDY: 12, LOYAL: -20,
            RIGHTEOUS: -5, CALM: -3, CAUTIOUS: -8, TIMID: -10,
        };
        discontent += personalityMods[ctx.officerPersonality] ?? 0;
        return Math.max(0, Math.min(100, discontent));
    }
    suppressRebellion(rulerMight, rulerIntelligence, rebelMight, garrisonLoyalty) {
        const supressionPower = rulerMight * 0.4 + rulerIntelligence * 0.3 + garrisonLoyalty * 0.3;
        const rebelPower = rebelMight * 0.7 + (100 - garrisonLoyalty) * 0.3;
        const suppressed = supressionPower > rebelPower;
        return {
            suppressed,
            description: suppressed
                ? "반란이 진압되었다."
                : "반란 세력이 진압에 저항하고 있다!",
        };
    }
}
//# sourceMappingURL=rebellion_system.js.map