/**
 * [Task 40] 결과 보고서 및 전후 통계 이벤트 발행
 *
 * 공성전 종료나 턴 연산 종료 후 양측 피해 통계를 가공하여
 * '전투 결과 보고 UI'용 상태 객체를 스트리밍.
 */
import { EventBus } from "./event_bus";
export declare class BattleReportPublisher {
    private readonly bus;
    constructor(bus: EventBus);
    publish(attackerId: string, defenderId: string, damage: number, moraleLoss: number, casualties: {
        dead: number;
        wounded: number;
        deserted: number;
    }): void;
}
//# sourceMappingURL=battle_report_publisher.d.ts.map