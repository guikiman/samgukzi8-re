/**
 * [26] 도시 등급 확장 엔진 — CityGradeManager
 *
 * 목적: 내정치 누적 시 도시 등급 업그레이드.
 */
export class CityGradeManager {
    checkGradeUp(commercial, agricultural, currentGrade) {
        if (commercial > 1000 && agricultural > 1000)
            return currentGrade + 1;
        return currentGrade;
    }
}
//# sourceMappingURL=city_grade_manager.js.map