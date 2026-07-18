/**
 * [66] 천하 통일 도달율 모니터 — UnificationMonitor
 *
 * 목적: 통일 진행률 체크 및 대항 세력 연합 트리거.
 */
export class UnificationMonitor {
    checkCoalition(cityCount, totalCities) {
        return cityCount / totalCities > 0.6; // 60% 이상 점령 시 연합 발동
    }
}
//# sourceMappingURL=unification_monitor.js.map