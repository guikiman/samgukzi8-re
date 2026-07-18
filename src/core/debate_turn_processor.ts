import { DebaterState, DebateCard, DebateRoundResult } from './debate_types';

export class DebateTurnProcessor {
  public static processRound(
    round: number,
    challenger: DebaterState,
    defender: DebaterState,
    cCard: DebateCard,
    dCard: DebateCard
  ): DebateRoundResult {
    let pointsDealt = 0;
    const spiritChanged = { [challenger.officerId]: 0, [defender.officerId]: 0 };
    const focusChanged = { [challenger.officerId]: 0, [defender.officerId]: 0 };
    let logMsg = '';

    challenger.focus = Math.max(0, challenger.focus - cCard.cost);

    if (cCard.type === 'ATTACK' && dCard.type === 'DEFENSE') {
        pointsDealt = Math.max(0, cCard.value - dCard.value);
        logMsg = `${challenger.name}가 ${cCard.name}로 공격! ${defender.name}가 ${dCard.name}로 방어하여 ${pointsDealt} 피해.`;
    } else if (cCard.type === 'FOCUS') {
        challenger.focus = Math.min(challenger.maxFocus, challenger.focus + cCard.value);
        logMsg = `${challenger.name}가 ${cCard.name}로 기세를 올립니다.`;
    }

    if (pointsDealt > 0) {
        defender.spirit = Math.max(0, defender.spirit - pointsDealt);
        spiritChanged[defender.officerId] = -pointsDealt;
    }

    return { round, attackerId: challenger.officerId, defenderId: defender.officerId, attackCard: cCard, defenseCard: dCard, pointsDealt, spiritChanged, focusChanged, log: logMsg };
  }
}
