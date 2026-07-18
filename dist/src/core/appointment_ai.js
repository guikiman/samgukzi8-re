export class AppointmentAI {
    selectGovernor(candidates) {
        const scored = candidates
            .map((o) => ({
            officerId: o.id,
            score: o.politics * 0.4 + o.intelligence * 0.3 + o.loyalty * 0.2 + o.charisma * 0.1,
        }))
            .sort((a, b) => b.score - a.score);
        if (scored.length === 0)
            return null;
        return { officerId: scored[0].officerId, position: "governor" };
    }
    selectCommander(candidates) {
        const scored = candidates
            .map((o) => ({
            officerId: o.id,
            score: o.leadership * 0.4 + o.might * 0.3 + o.intelligence * 0.2 + o.loyalty * 0.1,
        }))
            .sort((a, b) => b.score - a.score);
        if (scored.length === 0)
            return null;
        return { officerId: scored[0].officerId, position: "commander" };
    }
    selectStrategist(candidates) {
        const scored = candidates
            .map((o) => ({
            officerId: o.id,
            score: o.intelligence * 0.5 + o.leadership * 0.2 + o.charisma * 0.2 + o.loyalty * 0.1,
        }))
            .sort((a, b) => b.score - a.score);
        if (scored.length === 0)
            return null;
        return { officerId: scored[0].officerId, position: "strategist" };
    }
    assignGovernors(officers, cities) {
        const sortedOfficers = [...officers].sort((a, b) => b.politics - a.politics);
        const sortedCities = [...cities].sort((a, b) => b.importance - a.importance);
        const appointments = [];
        const maxAssign = Math.min(sortedOfficers.length, sortedCities.length);
        for (let i = 0; i < maxAssign; i++) {
            appointments.push({
                officerId: sortedOfficers[i].id,
                position: "governor",
                locationId: sortedCities[i].id,
            });
        }
        return appointments;
    }
    calculateGovernorCompetence(officer, cityStability) {
        return (officer.politics * 0.3 +
            officer.intelligence * 0.2 +
            officer.loyalty * 0.2 +
            (1 - cityStability / 100) * 0.3);
    }
    promoteByMerit(officer) {
        const rankThresholds = [0, 50, 120, 220, 360, 550, 800, 1100, 1500];
        const currentIndex = rankThresholds.findIndex((t) => t > officer.merit);
        const targetRank = rankThresholds.length - currentIndex;
        if (targetRank < officer.currentRank) {
            return { promoted: true, newRank: targetRank };
        }
        return { promoted: false };
    }
}
//# sourceMappingURL=appointment_ai.js.map