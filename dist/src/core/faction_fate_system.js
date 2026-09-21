/**
 * 세력 운명 시스템 — 멸망/통일 판정 [213][218]
 *
 * 매월 말 정산 후 호출:
 * 1) 도시 0개 세력 = 멸망 → 소속 무장은 재야(FREE)로 방출
 * 2) 생존 세력 1개 = 통일 → 엔딩 판정 (플레이어 세력이면 승리, 아니면 패배)
 */
import { OfficerStatus } from './types.js';
export class FactionFateSystem {
    constructor(store) {
        this.store = store;
    }
    /** 멸망 판정 + 통일 확인 — 월말 정산 후 호출 */
    checkFates() {
        const destroyedIds = [];
        const destroyedNames = [];
        for (const faction of this.store.getAllFactions()) {
            const cities = this.store.getCitiesByFaction(faction.id);
            if (cities.length === 0) {
                // 멸망: 소속 무장 전원 재야화 + 도시 무주화는 이미 소유 상실로 처리됨
                const officers = this.store.getAllOfficers().filter(o => o.factionId === faction.id);
                for (const o of officers) {
                    this.store.updateOfficer(o.id, {
                        factionId: null,
                        status: OfficerStatus.FREE,
                        rank: 0,
                        cityId: o.cityId,
                        loyalty: 0,
                    });
                    // 무장을 재야로 방출한 뒤 도시 무장 목록에서도 제거하지 않음 — cityId 유지로 재야 거점 유지
                }
                destroyedIds.push(faction.id);
                destroyedNames.push(faction.name);
            }
        }
        // [결함 수정] 멸망 세력을 스토어에서 완전 제거 — 기존에는 스토어에 남아
        // 매 턴 같은 세력이 반복 멸망 판정되고 외교 AI/패널에 유령 세력이 등장했다
        for (const id of destroyedIds) {
            this.store.removeFaction(id);
        }
        // 통일 판정: 도시를 보유한 생존 세력이 1개뿐인지
        const gs = this.store.getGlobalState();
        const aliveFactions = this.store.getAllFactions().filter(f => this.store.getCitiesByFaction(f.id).length > 0);
        let ending = null;
        let winnerName = null;
        if (aliveFactions.length === 1 && this.store.getAllCities().every(c => c.ownerId === aliveFactions[0].id)) {
            ending = aliveFactions[0].id === gs.playerFactionId ? 'PLAYER_UNIFICATION' : 'AI_UNIFICATION';
            winnerName = aliveFactions[0].name;
        }
        return { destroyedFactionIds: destroyedIds, destroyedFactionNames: destroyedNames, ending, winnerFactionName: winnerName };
    }
}
//# sourceMappingURL=faction_fate_system.js.map