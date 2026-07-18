export class SuccessionSystem {
    determineSuccessor(ctx) {
        const bloodlineCandidates = ctx.candidates.filter((c) => c.relationToLeader === "son" ||
            c.relationToLeader === "daughter" ||
            c.relationToLeader === "brother");
        if (bloodlineCandidates.length > 0 && ctx.factionStability > 40) {
            const scored = bloodlineCandidates
                .map((c) => ({
                candidate: c,
                score: c.leadership * 0.3 + c.charisma * 0.25 + c.loyalty * 0.2 + c.merit * 0.15 + c.intelligence * 0.1,
            }))
                .sort((a, b) => b.score - a.score);
            const chosen = scored[0].candidate;
            return {
                successorId: chosen.id,
                method: "bloodline",
                stabilityChange: 5,
                description: `${chosen.name}이(가) 혈통에 따라 세력을 계승했다.`,
            };
        }
        const meritCandidates = [...ctx.candidates]
            .sort((a, b) => b.merit - a.merit);
        if (meritCandidates.length > 0 && meritCandidates[0].merit > 100) {
            const chosen = meritCandidates[0];
            return {
                successorId: chosen.id,
                method: "merit",
                stabilityChange: -5,
                description: `${chosen.name}이(가) 공적을 인정받아 세력을 이끌게 되었다. (일부 무장의 불만이 예상된다)`,
            };
        }
        const ambitiousCandidates = ctx.candidates
            .filter((c) => c.ambition > 75 && c.leadership > 70)
            .sort((a, b) => b.ambition - a.ambition);
        if (ambitiousCandidates.length > 0) {
            const chosen = ambitiousCandidates[0];
            return {
                successorId: chosen.id,
                method: "coup",
                stabilityChange: -20,
                description: `${chosen.name}이(가) 쿠데타를 일으켜 권력을 장악했다! 세력이 혼란에 빠진다.`,
            };
        }
        return {
            successorId: "",
            method: "collapse",
            stabilityChange: -50,
            description: "적절한 후계자가 없어 세력이 붕괴했다!",
        };
    }
    calculateSuccessorLoyalty(successor, otherCandidates) {
        const loyaltyMap = new Map();
        for (const candidate of otherCandidates) {
            if (candidate.id === successor.id)
                continue;
            let loyalty = candidate.loyalty;
            if (candidate.ambition > 70)
                loyalty -= 15;
            if (candidate.relationToLeader === "son" && successor.relationToLeader !== "son")
                loyalty -= 10;
            loyaltyMap.set(candidate.id, Math.max(0, Math.min(100, loyalty)));
        }
        return loyaltyMap;
    }
}
//# sourceMappingURL=succession_system.js.map