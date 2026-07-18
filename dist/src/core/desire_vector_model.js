export class DesireVectorModel {
    calculatePriority(desire) {
        if (desire.ambition > 80)
            return "ATTACK";
        if (desire.loyalty < 30)
            return "BETRAY";
        return "IDLE";
    }
}
//# sourceMappingURL=desire_vector_model.js.map