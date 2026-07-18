/**
 * [Task 34] 전법 전용 시각 이펙트(FX) 오케스트레이션
 *
 * 전법 발동 시 입자 효과, 불덩어리, 성벽 파손 등
 * 리소스 연출 대기 시간을 시뮬레이션 속도와 동기화.
 */
export class TacticFxOrchestrator {
    constructor(bus) {
        this.bus = bus;
    }
    emitFx(name, origin, target, duration = 1000) {
        const payload = { name, origin, target, duration };
        this.bus.emit("RENDER_QUEUE_PUSH", { type: "TACTIC_FX", payload, timestamp: Date.now() }, "info");
    }
}
//# sourceMappingURL=tactic_fx_orchestrator.js.map