/**
 * 세력 운명 시스템 — 멸망/통일 판정 [213][218]
 *
 * 매월 말 정산 후 호출:
 * 1) 도시 0개 세력 = 멸망 → 소속 무장은 재야(FREE)로 방출
 * 2) 생존 세력 1개 = 통일 → 엔딩 판정 (플레이어 세력이면 승리, 아니면 패배)
 */

import type { GameStore } from './game_store.js';
import { OfficerStatus } from './types.js';
import { convertToFactionVagrant } from './vagrant_revival_system.js';

export type GameEnding = 'PLAYER_UNIFICATION' | 'AI_UNIFICATION' | null;

export interface VagrantConversionInfo {
    factionId: string;
    factionName: string;
    keptOfficers: number;
    releasedOfficers: number;
    message: string;
}

export interface FactionFateReport {
    destroyedFactionIds: string[];
    destroyedFactionNames: string[];
    ending: GameEnding;
    winnerFactionName: string | null;
    /** 플레이어 세력이 이번 판정에서 멸망했는가 — [213] playerFactionId 정합성 */
    playerFactionDestroyed?: boolean;
    /** 멸망 시 패배 안내 메시지 */
    playerDefeatMessage?: string;
    /** [83] 이번 판정에서 방랑군으로 전환된 세력 (멸망 제외) */
    vagrantConversions?: VagrantConversionInfo[];
}

export class FactionFateSystem {
    constructor(private store: GameStore) {}

    /** 멸망 판정 + 통일 확인 — 월말 정산 후 호출 */
    checkFates(): FactionFateReport {
        return this.checkFatesWithVagrantRevival(false);
    }

    /**
     * 멸망 판정 + 통일 확인 — 방랑군 재기 옵션 [83][213]
     * @param reviveAsVagrant true면 도시 0개 세력을 제거하지 않고 방랑군으로 전환.
     *        단, 세력이 도시를 잃고 무장까지 0명이면(재기 불가) 기존대로 제거한다.
     *        플레이어 세력은 무장이 남아 있는 한 항상 방랑군으로 생존.
     */
    checkFatesWithVagrantRevival(reviveAsVagrant: boolean): FactionFateReport {
        const destroyedIds: string[] = [];
        const destroyedNames: string[] = [];
        const vagrantConversions: VagrantConversionInfo[] = [];

        for (const faction of this.store.getAllFactions()) {
            const cities = this.store.getCitiesByFaction(faction.id);
            if (cities.length === 0) {
                // [83] 이미 방랑군인 세력은 재판정 대상 아님 — 매달 반복 전환/멸망 스팸 방지.
                // 재기 성공(도시 획득) 시 clearVagrantOnCityGain이 isVagrant를 해제한다.
                if (faction.isVagrant) continue;
                // [83][213] 방랑군 재기 — 재야화보다 먼저 판정: 무장이 남아 있고 옵션이 켜져 있으면
                // 세력을 제거하지 않고 방랑군으로 전환 (재야화 루프/제거 모두 스킵).
                // playerFactionId가 항상 유효한 세력을 가리키도록 보장.
                if (reviveAsVagrant) {
                    const members = this.store.getOfficersByFaction(faction.id);
                    if (members.length > 0) {
                        const conv = convertToFactionVagrant(this.store, faction.id);
                        if (conv) {
                            vagrantConversions.push({
                                factionId: conv.factionId,
                                factionName: conv.factionName,
                                keptOfficers: conv.keptOfficers,
                                releasedOfficers: conv.releasedOfficers,
                                message: conv.message,
                            });
                            continue;
                        }
                    }
                }
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
        // [83] 방랑군 전환에 성공한 세력은 destroyedIds에 들어가지 않는다 (위에서 continue)
        for (const id of destroyedIds) {
            this.store.removeFaction(id);
        }

        // 통일 판정: 도시를 보유한 생존 세력이 1개뿐인지
        const gs = this.store.getGlobalState();
        const aliveFactions = this.store.getAllFactions().filter(
            f => this.store.getCitiesByFaction(f.id).length > 0,
        );

        let ending: GameEnding = null;
        let winnerName: string | null = null;
        if (aliveFactions.length === 1 && this.store.getAllCities().every(c => c.ownerId === aliveFactions[0].id)) {
            ending = aliveFactions[0].id === gs.playerFactionId ? 'PLAYER_UNIFICATION' : 'AI_UNIFICATION';
            winnerName = aliveFactions[0].name;
        }

        // [213] playerFactionId 정합성 — 플레이어 세력이 멸망 목록에 있으면 패배 상태 반환.
        // 이후 executeTurn의 엔딩 판정에서 PLAYER_DEFEAT 이벤트로 이어져 게임오버 처리된다.
        const playerDestroyed = gs.playerFactionId !== null && destroyedIds.includes(gs.playerFactionId);
        let defeatMessage = '';
        if (playerDestroyed) {
            const survivor = ending ? winnerName : (this.store.getAllFactions()[0]?.name ?? null);
            defeatMessage = survivor
                ? `플레이어 세력이 멸망했습니다 — 천하의 주인은 ${survivor}에게 기울고 있습니다.`
                : '플레이어 세력이 멸망했습니다.';
        }

        // [83] 방랑군 전환 세력은 멸망이 아니므로 destroyed에서 제외 — 통일 판정/멸망 이벤트 정합성
        const destroyedReport = destroyedIds.filter(id => !vagrantConversions.some(v => v.factionId === id));

        return {
            destroyedFactionIds: destroyedReport,
            destroyedFactionNames: destroyedNames.filter(n => !vagrantConversions.some(v => v.factionName === n)),
            ending,
            winnerFactionName: winnerName,
            playerFactionDestroyed: playerDestroyed,
            playerDefeatMessage: defeatMessage,
            vagrantConversions,
        };
    }

}
