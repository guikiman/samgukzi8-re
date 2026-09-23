/**
 * 방랑군 재기 플레이 흐름 [83][421-440] — Vagrant Monthly Actions
 * 파일: src/core/vagrant_monthly_actions.ts
 *
 * 설계 스펙:
 * - [83] 방랑군 재기 — 영지를 잃은 세력이 재야 무장 등용 + 임계 도달 시 도시 습격으로 재기
 * - [24][421-440] 등용 성공률은 군주 카리스마/명성 기반 (기존 등용 시스템과 일관)
 * - [213] 재기 성공 시 FACTION_REVIVED 이벤트 발화 — playerFactionId 유효성 유지
 *
 * 월간 처리(executeTurn → processPortedSystemsMonthly 이후):
 * 1) 등용: 방랑군은 도시가 없어도 재야 무장을 등용 시도 (도시당 1명, 군주 charisma 기반)
 * 2) 습격: 방랑 세력 병력(잔존 충성 무장 기반 가치) ≥ 도시 danger 임계 도달 시
 *    최약 도시 습격 → 점령 판정 (점수 = 통솔 합 + 난수 vs 도시 방어)
 * 3) 점령 성공 시 clearVagrantOnCityGain으로 isVagrant 해제 → 재기 완료
 */

import type { GameStore } from './game_store.js';
import type { OfficerID } from './types.js';
import { clearVagrantOnCityGain } from './vagrant_revival_system.js';

export interface VagrantRaidResult {
    factionId: string;
    factionName: string;
    kind: 'RECRUIT' | 'RAID';
    success: boolean;
    message: string;
    /** 습격 성공 시 점령한 도시 */
    capturedCityId?: string;
    /** 등용 성공 시 영입된 무장 */
    recruitedOfficerId?: OfficerID;
}

/** 방랑 세력의 재기 역량 — 잔존 충성 무장 가치(병력 환산) */
export function computeVagrantStrength(store: GameStore, factionId: string): number {
    const faction = store.getFaction(factionId);
    if (!faction) return 0;
    return store.getOfficersByFaction(factionId)
        .filter(o => o.loyalty >= 40)
        .reduce((sum, o) => sum + o.stats.leadership * 20, 0);
}

/**
 * 방랑군 월간 자율 행동 — executeTurn 월간 훅에서 호출
 * @returns 이번 달 등용/습격 결과 목록 (이벤트 발화/UI 로그용)
 */
export function processVagrantMonthlyActions(store: GameStore): VagrantRaidResult[] {
    const results: VagrantRaidResult[] = [];

    for (const faction of store.getAllFactions()) {
        if (!faction.isVagrant) continue;

        const leader = faction.leaderId ? store.getOfficer(faction.leaderId) : null;
        if (!leader) continue;

        // ---- 1) 재야 무장 등용 [24] ----
        // 방랑군은 도시가 없으므로 재야 무장의 잔재 도시 1곳을 무작위 선택
        const freeOfficers = store.getAllOfficers().filter(
            o => o.factionId === null && o.status === 'FREE',
        );
        if (freeOfficers.length > 0) {
            const target = freeOfficers[Math.floor(Math.random() * freeOfficers.length)];
            // 성공률: 군주 카리스마 기반 (기존 등용 시스템과 동일 척도)
            const chance = Math.min(0.6, (leader.stats.charisma / 200) + (leader.fame / 2000));
            if (Math.random() < chance) {
                store.updateOfficer(target.id, {
                    factionId: faction.id,
                    status: 'OFFICER' as never,
                    loyalty: Math.round(50 + leader.stats.charisma / 4),
                });
                results.push({
                    factionId: faction.id,
                    factionName: faction.name,
                    kind: 'RECRUIT',
                    success: true,
                    message: `🤝 방랑군 ${faction.name}이(가) 재야 무장 ${target.name}을(를) 영입했습니다 (카리스마 ${leader.stats.charisma})`,
                    recruitedOfficerId: target.id,
                });
            } else {
                results.push({
                    factionId: faction.id,
                    factionName: faction.name,
                    kind: 'RECRUIT',
                    success: false,
                    message: `방랑군 ${faction.name}의 ${target.name} 등용이 실패했습니다.`,
                });
            }
        }

        // ---- 2) 도시 습격 [83] ----
        const strength = computeVagrantStrength(store, faction.id);
        const allCities = store.getAllCities();
        // 방랑 세력 병력이 최약 도시 방어보다 강할 때만 시도 — 무모한 습격 방지
        const candidates = allCities
            .filter(c => c.ownerId !== null && c.ownerId !== faction.id)
            .sort((a, b) => a.defense - b.defense);
        const weakest = candidates[0];

        if (weakest && strength >= weakest.defense * 10) {
            // 점수 판정: 통솔 합 + 난수 vs 도시 방어 × 10
            const assaultScore = store.getOfficersByFaction(faction.id)
                .reduce((s, o) => s + o.stats.leadership, 0) + Math.random() * 60;
            if (assaultScore >= weakest.defense) {
                const previousOwner = weakest.ownerId;
                store.updateCity(weakest.id, { ownerId: faction.id });
                clearVagrantOnCityGain(store, faction.id);
                results.push({
                    factionId: faction.id,
                    factionName: faction.name,
                    kind: 'RAID',
                    success: true,
                    capturedCityId: weakest.id,
                    message: `⚔️ 방랑군 ${faction.name}이(가) ${weakest.name}을(를) 습격해 점령했습니다!${previousOwner ? ` (기존 소유: ${previousOwner})` : ''} — 재기 성공`,
                });
            } else {
                results.push({
                    factionId: faction.id,
                    factionName: faction.name,
                    kind: 'RAID',
                    success: false,
                    message: `방랑군 ${faction.name}의 ${weakest.name} 습격이 격퇴되었습니다 (도시 방어 ${weakest.defense}).`,
                });
            }
        }
    }

    return results;
}

// ============================================================
// [83] 플레이어 지시 도시 습격 — 전략 포인트 소비 커맨드
// ============================================================

/** 습격 커맨드 소비 전략 포인트 */
export const RAID_COMMAND_COST = 30;

export interface PlayerRaidOutcome {
    success: boolean;
    message: string;
    capturedCityId?: string;
}

/**
 * 플레이어 방랑군 습격 판정 — UI 커맨드에서 호출 [83]
 * (자율 습격과 동일한 판정식, 전략 포인트 소비는 호출부에서)
 * @returns 습격 성공 여부 및 안내 메시지
 */
export function resolvePlayerRaid(store: GameStore, factionId: string, targetCityId: string): PlayerRaidOutcome {
    const faction = store.getFaction(factionId);
    if (!faction) return { success: false, message: '세력을 찾을 수 없습니다.' };
    const city = store.getCity(targetCityId);
    if (!city) return { success: false, message: '대상 도시를 찾을 수 없습니다.' };
    if (city.ownerId === factionId) return { success: false, message: '이미 자기 세력 도시입니다.' };

    const strength = computeVagrantStrength(store, factionId);
    if (strength < city.defense * 10) {
        return { success: false, message: `⚔️ ${city.name} 습격에 필요한 병력이 부족합니다 (요구 방어 ${city.defense}×10, 현재 역량 ${strength}).` };
    }

    const leaders = store.getOfficersByFaction(factionId)
        .sort((a, b) => b.stats.leadership - a.stats.leadership);
    const assaultScore = leaders.reduce((s, o) => s + o.stats.leadership, 0) + Math.random() * 60;
    if (assaultScore >= city.defense) {
        const previousOwner = city.ownerId;
        store.updateCity(city.id, { ownerId: factionId });
        clearVagrantOnCityGain(store, factionId);
        return {
            success: true,
            capturedCityId: city.id,
            message: `⚔️ ${faction.name}이(가) ${city.name}을(를) 점령했습니다!${previousOwner ? ` (기존 소유: ${previousOwner})` : ''} — 재기 성공`,
        };
    }
    return { success: false, message: `⚔️ ${city.name} 습격이 격퇴되었습니다 (도시 방어 ${city.defense}).` };
}
