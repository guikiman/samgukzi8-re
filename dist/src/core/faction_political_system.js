export class FactionPoliticalSystem {
    constructor() {
        this.factions = new Map();
        this.factionAssignment = new Map();
        this.events = [];
    }
    registerFaction(faction) {
        this.factions.set(faction.id, faction);
        for (const memberId of faction.memberIds) {
            this.factionAssignment.set(memberId, faction.id);
        }
    }
    getOfficerFaction(officerId) {
        const factionId = this.factionAssignment.get(officerId);
        return factionId ? this.factions.get(factionId) ?? null : null;
    }
    getFactions() {
        return Array.from(this.factions.values());
    }
    assignToFaction(officerId, factionId) {
        const faction = this.factions.get(factionId);
        if (!faction)
            return false;
        this.factionAssignment.set(officerId, factionId);
        faction.memberIds.push(officerId);
        return true;
    }
    removeFromFaction(officerId) {
        const factionId = this.factionAssignment.get(officerId);
        if (!factionId)
            return false;
        const faction = this.factions.get(factionId);
        if (faction) {
            faction.memberIds = faction.memberIds.filter(id => id !== officerId);
        }
        this.factionAssignment.delete(officerId);
        return true;
    }
    generatePowerStruggle(leaderId, challengerId) {
        const event = {
            type: "power_struggle",
            description: `${leaderId}와 ${challengerId}가 파벌 내 권력 다툼을 벌이고 있다.`,
            participants: [leaderId, challengerId],
            influenceDelta: { [leaderId]: -10, [challengerId]: 15 },
        };
        this.events.push(event);
        this.applyInfluenceDelta(event.influenceDelta);
        return event;
    }
    applyInfluenceDelta(delta) {
        for (const [officerId, deltaValue] of Object.entries(delta)) {
            const factionId = this.factionAssignment.get(officerId);
            if (!factionId)
                continue;
            const faction = this.factions.get(factionId);
            if (faction) {
                faction.influence = Math.max(0, Math.min(100, faction.influence + deltaValue));
            }
        }
    }
    calculateLoyaltyModifier(officerId, rulerPersonality) {
        const faction = this.getOfficerFaction(officerId);
        if (!faction)
            return 0;
        const rulerFaction = this.getOfficerRulerFaction(rulerPersonality);
        if (!rulerFaction)
            return 0;
        if (faction.id === rulerFaction.id)
            return 5;
        const ideologyConflict = faction.ideology !== rulerFaction.ideology ? -10 : 0;
        return ideologyConflict + Math.floor((faction.influence - 50) / 10);
    }
    getOfficerRulerFaction(rulerPersonality) {
        const preferredIdeology = {
            AGGRESSIVE: "militarist",
            AMBITIOUS: "expansionist",
            CALM: "diplomatic",
            CAUTIOUS: "conservative",
            LOYAL: "conservative",
            RIGHTEOUS: "reformist",
            GREEDY: "expansionist",
            TIMID: "diplomatic",
        };
        const ideology = preferredIdeology[rulerPersonality];
        return Array.from(this.factions.values()).find(f => f.ideology === ideology) ?? this.factions.values().next().value ?? null;
    }
    getRecentEvents(limit = 10) {
        return this.events.slice(-limit);
    }
}
//# sourceMappingURL=faction_political_system.js.map