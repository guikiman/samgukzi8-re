export class AIStreamManager {
  constructor(onFactionUpdate, onTurnComplete) {
    this.worker = new Worker(new URL('./ai.worker.js', import.meta.url), { type: 'module' });
    this.onFactionUpdate = onFactionUpdate; // 세력별 연산 완료 시 콜백
    this.onTurnComplete = onTurnComplete;   // 전체 1,000명 연산 완료 시 콜백
    this.init();
  }

  init() {
    this.worker.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'STREAM_FACTION_DECISION':
          // 실시간 스트리밍 데이터 수신: UI 및 관계망 DB 즉시 업데이트
          this.onFactionUpdate(data);
          break;
        case 'AI_TURN_COMPLETE':
          this.onTurnComplete();
          break;
        case 'ERROR':
          console.error('AI Worker Error:', data);
          break;
      }
    };
  }

  // 매달 평정 페이즈 시작 시 호출
  startMonthlyTurn(gameState) {
    // 대용량의 전체 상태를 넘기지 않고, AI 연산에 필요한 최소 데이터셋만 직렬화하여 전달
    this.worker.postMessage({
      type: 'START_AI_TURN',
      payload: {
        factions: gameState.factions,
        officers: gameState.officers,
        cities: gameState.cities
      }
    });
  }

  terminate() {
    this.worker.terminate();
  }
}
