/**
 * [E4] 치안(민심) 안정 기믹 — Public Order System
 *
 * PublicOrderSystem:
 *   1. 치안 수치 0~100, 하락 시 도적·반란군 발생 확률 증가
 *   2. 치안 = 기본치안 - 점령후감소 + 치안유지활동
 *   3. 반란 확률 = (100 - 치안) / 200
 *   4. 무장 순찰 시 치안 회복
 */
export class PublicOrderSystem {
    constructor() {
        this.MAX_ORDER = 100;
    }
    getRevoltRisk(city) {
        return Math.max(0, (this.MAX_ORDER - city.orderLevel) / 200);
    }
    patrol(city, officerPolitics, hasPoliceSkill) {
        const riskBefore = this.getRevoltRisk(city);
        const skillBonus = hasPoliceSkill ? 0.4 : 0;
        const gain = Math.floor((officerPolitics / 100 + skillBonus) * 8 + Math.random() * 5);
        city.orderLevel = Math.min(this.MAX_ORDER, city.orderLevel + gain);
        city.recentPatrolBonus = Math.min(20, city.recentPatrolBonus + gain);
        return {
            orderGain: gain,
            newOrderLevel: city.orderLevel,
            revoltRiskBefore: riskBefore,
            revoltRiskAfter: this.getRevoltRisk(city),
        };
    }
    checkRevolt(city) {
        const risk = this.getRevoltRisk(city);
        const revoltOccurred = Math.random() < risk;
        if (revoltOccurred) {
            const rebelPower = Math.floor((this.MAX_ORDER - city.orderLevel) * 10 + Math.random() * 50);
            city.orderLevel = Math.max(0, city.orderLevel - 15);
            return { revoltOccurred: true, rebelPower, reason: `치안 ${city.orderLevel}로 반란 발생! 반군 세력 ${rebelPower}` };
        }
        return { revoltOccurred: false, rebelPower: 0, reason: '안정적인 치안 유지 중' };
    }
    applyOccupationPenalty(city) {
        const penalty = Math.floor(Math.random() * 15) + 5;
        city.occupationPenalty = Math.min(30, city.occupationPenalty + penalty);
        city.orderLevel = Math.max(0, city.orderLevel - penalty);
    }
    processMonthlyDecay(city) {
        // 매달 치안 자연 감소
        city.orderLevel = Math.max(0, city.orderLevel - 2);
        city.occupationPenalty = Math.max(0, city.occupationPenalty - 1);
        city.recentPatrolBonus = Math.max(0, city.recentPatrolBonus - 3);
    }
}
//# sourceMappingURL=public_order_system.js.map