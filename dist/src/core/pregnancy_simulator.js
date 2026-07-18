export class PregnancySimulator {
    constructor() {
        this.pregnancies = new Map();
    }
    calculatePregnancyChance(motherAge, marriageDuration, existingChildren) {
        if (motherAge < 16 || motherAge > 45)
            return 0;
        if (existingChildren >= 6)
            return 0.01;
        const ageFactor = motherAge <= 30 ? 0.15 : motherAge <= 38 ? 0.1 : 0.03;
        const durationFactor = Math.min(0.1, marriageDuration * 0.02);
        const existingPenalty = existingChildren * 0.02;
        return Math.max(0.01, ageFactor + durationFactor - existingPenalty);
    }
    conceive(motherId, fatherId, currentTurn) {
        const event = {
            motherId, fatherId,
            conceivedAtTurn: currentTurn,
            dueTurn: currentTurn + 9,
            complications: Math.random() < 0.05,
        };
        this.pregnancies.set(`${motherId}_${currentTurn}`, event);
        return event;
    }
    checkBirth(pregnancy, currentTurn) {
        if (currentTurn < pregnancy.dueTurn)
            return { birth: false, stillbirth: false, twins: false };
        const stillbirth = pregnancy.complications && Math.random() < 0.15;
        const twins = !stillbirth && Math.random() < 0.03;
        return { birth: true, stillbirth, twins };
    }
    getActivePregnancies() {
        return Array.from(this.pregnancies.values());
    }
    removePregnancy(motherId, turn) {
        this.pregnancies.delete(`${motherId}_${turn}`);
    }
    generateBirthEvent(motherName, fatherName, twins, stillbirth) {
        if (stillbirth)
            return `${motherName}이(가) 사산했다... 모두가 슬퍼한다.`;
        if (twins)
            return `${motherName}이(가) 쌍둥이를 출산했다! ${fatherName}의 가문에 경사가 났다!`;
        return `${motherName}이(가) 건강한 아이를 출산했다. ${fatherName}의 후계자가 태어났다!`;
    }
}
//# sourceMappingURL=pregnancy_simulator.js.map