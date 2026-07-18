/**
 * [Task 40] 결과 보고서 및 전후 통계 이벤트 발행
 *
 * 공성전 종료나 턴 연산 종료 후 양측 피해 통계를 가공하여
 * '전투 결과 보고 UI'용 상태 객체를 스트리밍.
 */
export class BattleReportPublisher {
    constructor(bus) {
        this.bus = bus;
    }
    publish(attackerId, defenderId, damage, moraleLoss, casualties) {
        const payload = { attackerId, defenderId, damage, moraleLoss, casualties };
        this.bus.emit("RENDER_QUEUE_PUSH", { type: "BATTLE_REPORT", payload, timestamp: Date.now() }, "info");
    }
}
//# sourceMappingURL=battle_report_publisher.js.map