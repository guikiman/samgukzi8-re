/**
 * [Task 37] 플로팅 텍스트(Floating Text) 및 연출 전송기
 *
 * 피격 수치("-1450"), 전법명("돌격!"), 무장 컷인 일러스트
 * 메타 데이터를 패키징하여 렌더 큐에 전달.
 */
import { EventBus } from "./event_bus";
import { HexCoord } from "./render_queue_types";
export declare class FloatingTextTransmitter {
    private readonly bus;
    constructor(bus: EventBus);
    emit(text: string, coord: HexCoord, color?: string, duration?: number): void;
}
//# sourceMappingURL=floating_text_transmitter.d.ts.map