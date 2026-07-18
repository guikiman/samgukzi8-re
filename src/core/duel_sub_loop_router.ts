/**
 * [Task 29] 일기토(Duel) 및 설전(Debate) 스페셜 페이즈 브레이커
 *
 * RESOLUTION 연산 중 무장 간 충돌이 감지되면
 * 메인 루프를 '일기토 미니게임 상태'로 일시 전환하고
 * 결과를 수집하여 복귀하는 서브 루프 라우터.
 */

export type SpecialPhase = "duel" | "debate" | "none";

export interface DuelResult {
  readonly winnerId: string;
  readonly loserId: string;
  readonly winnerHpRemaining: number;
  readonly loserHpRemaining: number;
}

export interface SubLoopResult {
  readonly phase: SpecialPhase;
  readonly result?: DuelResult;
}

export class DuelSubLoopRouter {
  detectSpecialPhase(attackerId: string, defenderId: string, rngValue: number): SpecialPhase {
    if (rngValue < 0.05) return "duel";
    if (rngValue < 0.1) return "debate";
    return "none";
  }

  simulateDuel(officer1: { id: string; attack: number; hp: number }, officer2: { id: string; attack: number; hp: number }): DuelResult {
    let hp1 = officer1.hp;
    let hp2 = officer2.hp;

    while (hp1 > 0 && hp2 > 0) {
      hp2 -= Math.max(1, officer1.attack - Math.floor(Math.random() * 5));
      if (hp2 <= 0) break;
      hp1 -= Math.max(1, officer2.attack - Math.floor(Math.random() * 5));
    }

    return {
      winnerId: hp2 <= 0 ? officer1.id : officer2.id,
      loserId: hp2 <= 0 ? officer2.id : officer1.id,
      winnerHpRemaining: Math.max(0, hp2 <= 0 ? hp1 : hp2),
      loserHpRemaining: 0,
    };
  }
}
