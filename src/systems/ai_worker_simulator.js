// src/systems/ai_worker_simulator.js

self.onmessage = async function(event) {
    const { type, payload } = event.data;

    if (type === 'START_AI_TURN') {
        const { officers, factions } = payload;
        console.log(`[AI Worker] 1,000명 무장 스트리밍 연산 시작...`);

        // 세력별/무장별로 데이터를 청크(Chunk) 단위로 쪼개어 루프 구동
        for (const officer of officers) {
            if (officer.isPlayer) continue;

            const decision = calculateNPCAction(officer);

            self.postMessage({
                type: 'STREAM_OFFICER_DECISION',
                data: {
                    officerId: officer.id,
                    action: decision.action,
                    targetId: decision.targetId
                }
            });

            // 연산 집약적인 구간에서 메인 스레드 부하 분산을 위해 
            // requestAnimationFrame과 유사한 비동기 스케줄링 적용
            if (officers.indexOf(officer) % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // 전체 1,000명 무장 턴 종료 보고
        self.postMessage({ type: 'AI_TURN_COMPLETE' });
    }
};

function calculateNPCAction(officer) {
    if (officer.cityDefense < 50) return { action: 'BUILD_DEFENSE' };
    if (officer.aggressionWeight > 0.7) return { action: 'MILITARY_DRAFT' };
    return { action: 'INTERNAL_DEVELOP' };
}
