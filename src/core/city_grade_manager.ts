/**
 * [26] 도시 등급 확장 엔진 — CityGradeManager
 * 
 * 목적: 내정치 누적 시 도시 등급 업그레이드.
 */
export class CityGradeManager {
    public checkGradeUp(commercial: number, agricultural: number, currentGrade: number): number {
        if (commercial > 1000 && agricultural > 1000) return currentGrade + 1;
        return currentGrade;
    }
}
