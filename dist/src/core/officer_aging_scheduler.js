/**
 * [12] 무장 수명 및 자연사(Aging) 트리거 스케줄러 — OfficerAgingScheduler
 *
 * OfficerAgingScheduler:
 *   1. 매년 첫 턴 시작 시 무장의 나이를 1 증가
 *   2. 역사적 수명(deathYear)에 도달했을 때 사망 이벤트 호출
 *   3. 병(illness) 상태일 때 추가 사망 확률 롤
 *   4. 자연사 확률 = DeathSuccessionManager의 확률 테이블 활용
 *   5. 사망 이벤트 발생 시 DeathSuccessionManager로 위임
 */
// ============================================================
// OfficerAgingScheduler
// ============================================================
export class OfficerAgingScheduler {
    constructor(deathManager) {
        this.currentYear = 184;
        this.agedOfficers = [];
        this.deathTriggers = [];
        this.deathManager = deathManager;
    }
    /**
     * 매년 첫 턴에 호출되어 모든 무장의 나이를 1 증가시키고
     * 사망 조건을 검사한다.
     * @param officers 전체 무장 목록
     * @param currentYear 현재 게임 년도
     * @returns 에이징 및 사망 이벤트 결과
     */
    processAnnualAging(officers, currentYear) {
        this.deathManager.setCurrentDate(currentYear);
        const agingEvents = [];
        const deathEvents = [];
        for (const officer of officers) {
            const age = currentYear - officer.birthYear;
            const previousAge = age - 1;
            // 1. 나이 증가 기록
            agingEvents.push({
                officerId: officer.id,
                name: officer.name,
                previousAge,
                newAge: age,
                year: currentYear,
                isBirthday: true,
            });
            // 2. 역사적 사망년도 도달 검사
            if (officer.deathYear !== null && currentYear >= officer.deathYear) {
                const cause = 'OLD_AGE';
                const deathEvent = this.deathManager.processDeath(officer.id, officer.factionId ?? 'none', cause, age);
                this.deathTriggers.push({
                    officerId: officer.id,
                    name: officer.name,
                    age,
                    cause,
                    year: currentYear,
                    deathEvent,
                });
                continue;
            }
            // 3. 자연사 확률 롤
            if (this.deathManager.rollNaturalDeath(age)) {
                const cause = 'NATURAL';
                const deathEvent = this.deathManager.processDeath(officer.id, officer.factionId ?? 'none', cause, age);
                this.deathTriggers.push({
                    officerId: officer.id,
                    name: officer.name,
                    age,
                    cause,
                    year: currentYear,
                    deathEvent,
                });
                continue;
            }
            // 4. 부상 상태에서 사망 확률 증가
            if (officer.injuries > 0) {
                const illnessDeathChance = (officer.injuries / officer.maxHp) * 0.1;
                if (Math.random() < illnessDeathChance) {
                    const cause = 'ILLNESS';
                    const deathEvent = this.deathManager.processDeath(officer.id, officer.factionId ?? 'none', cause, age);
                    this.deathTriggers.push({
                        officerId: officer.id,
                        name: officer.name,
                        age,
                        cause,
                        year: currentYear,
                        deathEvent,
                    });
                }
            }
        }
        return {
            agingEvents,
            deathEvents: this.deathTriggers,
            totalAged: agingEvents.length,
            totalDeaths: this.deathTriggers.length,
        };
    }
    /**
     * 현재 게임 년도를 설정한다.
     */
    setCurrentYear(year) {
        this.currentYear = year;
    }
    /**
     * 현재 년도를 반환한다.
     */
    getCurrentYear() {
        return this.currentYear;
    }
    /**
     * 특정 무장의 현재 나이를 계산한다.
     */
    calculateAge(officer, currentYear) {
        return currentYear - officer.birthYear;
    }
    /**
     * 사망 트리거 이력을 반환한다.
     */
    getDeathTriggers() {
        return [...this.deathTriggers];
    }
    /**
     * 에이징 이력을 반환한다.
     */
    getAgingEvents() {
        return [...this.agedOfficers];
    }
    /**
     * 상태를 초기화한다.
     */
    clear() {
        this.agedOfficers = [];
        this.deathTriggers = [];
    }
}
//# sourceMappingURL=officer_aging_scheduler.js.map