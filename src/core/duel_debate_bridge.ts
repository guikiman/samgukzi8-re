/**
 * [16] 설전/일기토 강제 난입 브릿지 — DuelDebateBridge
 * 
 * 목적: 이벤트 중 일기토/설전 미니게임으로 전환.
 */
export class DuelDebateBridge {
    public startMinigame(type: 'DUEL' | 'DEBATE', participants: any[]): void {
        console.log(`[Bridge] ${type} 미니게임으로 상태 전환.`);
    }
}
