import { DuelDeckBuilder, type DuelDeck } from './duel_deck_builder';
import { DuelTurnProcessor, type DuelState } from './duel_turn_processor';

function runDuelSimulation() {
  console.log("--- 일기토 시뮬레이션 시작: 관우 vs 여포 ---");

  const deckBuilder = new DuelDeckBuilder();
  const turnProcessor = new DuelTurnProcessor();

  const guanYuDeck = deckBuilder.buildDeck('guan_yu', 98, ['무쌍']);
  const luBuDeck = deckBuilder.buildDeck('lu_bu', 100, ['무쌍', '일기토']);

  console.log(`${guanYuDeck.ownerId} (무력: ${guanYuDeck.ownerMight}) vs ${luBuDeck.ownerId} (무력: ${luBuDeck.ownerMight})`);

  let state = turnProcessor.startDuel('guan_yu', 98, 'lu_bu', 100);

  for (let round = 1; round <= 3; round++) {
    console.log(`\n[Round ${round}]`);

    const guanCard = deckBuilder.drawCard(guanYuDeck);
    const luBuCard = deckBuilder.drawCard(luBuDeck);

    if (!guanCard || !luBuCard) break;

    const aiCard = turnProcessor.selectAICard(state, 100);

    state = turnProcessor.processTurn(state, guanCard, aiCard);

    const lastResult = state.results[state.results.length - 1];
    console.log(lastResult?.description ?? '');
    console.log(`관우 HP: ${state.playerHp}, 여포 HP: ${state.aiHp}`);
  }

  console.log("\n--- 일기토 시뮬레이션 종료 ---");
}

runDuelSimulation();
