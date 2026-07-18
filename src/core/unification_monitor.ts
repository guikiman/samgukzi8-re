/**
 * [66] 천하 통일 도달율 모니터 — UnificationMonitor
 * 
 * 목적: 통일 진행률 체크 및 대항 세력 연합 트리거.
 */
export class UnificationMonitor {
    public checkCoalition(cityCount: number, totalCities: number): boolean {
        return cityCount / totalCities > 0.6; // 60% 이상 점령 시 연합 발동
    }
}
