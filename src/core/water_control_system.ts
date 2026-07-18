/**
 * [31] 치수 및 개간 연산기 — WaterControlSystem
 * 
 * 목적: 홍수 예방 및 농업 생산력 증대.
 */
export class WaterControlSystem {
    public calculateEffect(floodControl: number): number {
        return Math.floor(floodControl * 0.15);
    }
}
