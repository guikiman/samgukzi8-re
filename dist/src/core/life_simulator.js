/**
 * [Phase 24] 무장 인생 시뮬레이션 — Life Simulator
 * 파일: src/core/life_simulator.ts
 *
 * 설계 스펙:
 * - [421] 전상(戰傷) 시스템 — 전투 부상 누적 및 능력치 페널티
 * - [422] 무기 제련 — 금 소모로 무기 제작/강화
 * - [423] 학파 수련 — 특정 학파 가입 및 효과
 * - [434] 은퇴 — 고령 무장 은퇴 처리
 * - [438] 사사(師事) — 스승-제자 관계 형성 및 능력 이전
 *
 * Python 원본: src/systems/life_simulator.py
 */
// ============================================================
// 2. Life Simulator 엔진
// ============================================================
export class LifeSimulator {
    constructor() {
        this.scars = new Map();
        this.craftedWeapons = new Map();
        this.masteries = new Map();
        this.mentorships = [];
        this.retiredOfficers = new Map();
    }
    // --------------------------------------------------------
    // [421] 전상 시스템
    // --------------------------------------------------------
    /** 전상 부여 — 중복 부상은 심각도 누적 */
    applyScar(officerId, scarType, year = 0, severity = 1) {
        const list = this.scars.get(officerId) ?? [];
        list.push({ officerId, scarType, yearAcquired: year, severity });
        this.scars.set(officerId, list);
    }
    getScars(officerId) {
        return this.scars.get(officerId) ?? [];
    }
    hasScar(officerId, scarType) {
        return (this.scars.get(officerId) ?? []).some((s) => s.scarType === scarType);
    }
    /**
     * 전상에 따른 능력치 페널티 계산
     * @returns { STR, DEF, INT, POL } 각 항목 감소량 (음수)
     */
    getScarPenalties(officerId) {
        let pen = { STR: 0, DEF: 0, INT: 0, POL: 0 };
        for (const scar of this.scars.get(officerId) ?? []) {
            const mult = scar.severity;
            switch (scar.scarType) {
                case 'HEAD':
                    pen.INT -= 2 * mult;
                    break;
                case 'TORSO':
                    pen.STR -= 1 * mult;
                    pen.DEF -= 2 * mult;
                    break;
                case 'ARM':
                    pen.STR -= 3 * mult;
                    break;
                case 'LEG':
                    pen.DEF -= 1 * mult;
                    pen.POL -= 1 * mult;
                    break;
                case 'EYE':
                    pen.INT -= 1 * mult;
                    pen.STR -= 1 * mult;
                    break;
            }
        }
        return pen;
    }
    // --------------------------------------------------------
    // [422] 무기 제련
    // --------------------------------------------------------
    /**
     * 무기 제작/강화 — 금 500 이상 필요
     * @returns 제작 성공 시 CraftedWeapon, 실패 시 null
     */
    craftWeapon(officerId, gold, year = 0) {
        if (gold < LifeSimulator.WEAPON_FORGE_COST)
            return null;
        const weapon = {
            officerId,
            weaponName: `연마검#${officerId}`,
            attackBonus: 5 + Math.floor(gold / LifeSimulator.WEAPON_FORGE_COST),
            yearForged: year,
        };
        const list = this.craftedWeapons.get(officerId) ?? [];
        list.push(weapon);
        this.craftedWeapons.set(officerId, list);
        return weapon;
    }
    getWeapons(officerId) {
        return this.craftedWeapons.get(officerId) ?? [];
    }
    // --------------------------------------------------------
    // [423] 학파 수련 / [438] 사사(스승-제자)
    // --------------------------------------------------------
    /**
     * 사사 관계 형성 — 스승의 숙련도에서 제자에게 일부 이전
     * @returns 성공 시 MentorshipRecord, 스승이 해당 기술 미보유 시 null
     */
    masterSkill(studentId, masterId, skill) {
        const masterMastery = this.masteries.get(masterId)?.get(skill) ?? 0;
        if (masterMastery <= 0)
            return null; // 스승이 가르칠 수 없음
        const gain = Math.max(1, Math.floor(masterMastery * 0.2));
        const studentMap = this.masteries.get(studentId) ?? new Map();
        const current = studentMap.get(skill) ?? 0;
        studentMap.set(skill, Math.min(LifeSimulator.MAX_MASTERY, current + gain));
        this.masteries.set(studentId, studentMap);
        const record = { studentId, masterId, skill, masteryGain: gain };
        this.mentorships.push(record);
        return record;
    }
    /**
     * 숙련 직접 부여 — 세이브 로드 복원 및 초기 배경 스토리 반영용
     */
    grantMastery(officerId, skill, value) {
        const map = this.masteries.get(officerId) ?? new Map();
        map.set(skill, Math.min(LifeSimulator.MAX_MASTERY, Math.max(0, value)));
        this.masteries.set(officerId, map);
    }
    getMastery(officerId, skill) {
        return this.masteries.get(officerId)?.get(skill) ?? 0;
    }
    getMentorships(studentId) {
        if (!studentId)
            return this.mentorships;
        return this.mentorships.filter((m) => m.studentId === studentId);
    }
    // --------------------------------------------------------
    // [434] 은퇴
    // --------------------------------------------------------
    /** 은퇴 가능 연령 도달 여부 */
    canRetire(officerId, age) {
        return age >= LifeSimulator.RETIREMENT_AGE && !this.retiredOfficers.has(officerId);
    }
    /** 은퇴 처리 — 이후 전투/내정 배제 대상 */
    retire(officerId, year, finalRank = '평무장') {
        const record = { officerId, retireYear: year, finalRank };
        this.retiredOfficers.set(officerId, record);
        return record;
    }
    isRetired(officerId) {
        return this.retiredOfficers.has(officerId);
    }
    /** 은퇴 무장 전체 조회 — 월간 틱/세이브용 */
    getAllRetiredOfficers() {
        return [...this.retiredOfficers.values()];
    }
    /** 은퇴 기록 복원 — 세이브 로드 (빈 배열이면 초기화 상태 유지) */
    restoreRetiredOfficers(records) {
        for (const r of records) {
            this.retiredOfficers.set(r.officerId, r);
        }
    }
}
LifeSimulator.WEAPON_FORGE_COST = 500;
LifeSimulator.RETIREMENT_AGE = 60;
LifeSimulator.MAX_MASTERY = 100;
//# sourceMappingURL=life_simulator.js.map