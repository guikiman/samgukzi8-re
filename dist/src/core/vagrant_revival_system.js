/**
 * 방랑군 재기 시스템 [82-83][213] — Vagrant Revival System
 * 파일: src/core/vagrant_revival_system.ts
 *
 * 설계 스펙:
 * - [83] 방랑군 — 영지를 잃은 군주가 직속 무장과 함께 재기를 노리는 병력 없는 세력
 * - [213] playerFactionId 정합성 — 플레이어 세력 멸망 시 세력을 제거하지 않고
 *   방랑군으로 전환하여 playerFactionId가 항상 유효한 세력을 가리키게 한다
 *
 * 동작:
 * 1) 멸망 판정 직전 호출: 도시 0개가 될 세력을 재야화하지 않고 방랑군으로 전환
 * 2) 방랑군은 isVagrant=true, 도시/병력 없음, 직속 무장만 유지 (충성도 30 회복 — 결의)
 * 3) 이후 타 도시 이동/등용/재기 흐름의 기반 (기존 movement/등용 시스템 재사용)
 */
import { OfficerStatus, OfficerRank } from './types.js';
/**
 * 멸망 직전 세력을 방랑군으로 전환 [83]
 * - 도시 보유 0개 판정 시점(checkFates 이전/이후)에 호출
 * - 군주 + 충성도 상위 무장은 유지, 나머지는 재야 방출
 * - 세력 레코드는 스토어에 남는다 (playerFactionId 유효성 보장)
 */
export function convertToFactionVagrant(store, factionId) {
    const faction = store.getFaction(factionId);
    if (!faction)
        return null;
    // 이미 방랑군이면 중복 전환 없음
    if (faction.isVagrant) {
        return {
            factionId,
            factionName: faction.name,
            keptOfficers: faction.officers.length,
            releasedOfficers: 0,
            message: `${faction.name}은(는) 이미 방랑군 상태입니다.`,
        };
    }
    // 소속 무장 정리: 군주 + 충성도 상위 KEEP 상한까지 유지, 나머지 재야화
    const MAX_VAGRANT_OFFICERS = 5;
    const members = store.getOfficersByFaction(factionId);
    const sorted = [...members].sort((a, b) => {
        if (a.id === faction.leaderId)
            return -1;
        if (b.id === faction.leaderId)
            return 1;
        return b.loyalty - a.loyalty;
    });
    const keep = sorted.slice(0, MAX_VAGRANT_OFFICERS);
    const release = sorted.slice(MAX_VAGRANT_OFFICERS);
    for (const o of release) {
        store.updateOfficer(o.id, {
            factionId: null,
            status: OfficerStatus.FREE,
            loyalty: 0,
        });
    }
    // 유지 무장: 결의 회복 [C-인간관계] — 몰락한 주군을 따르는 의지
    for (const o of keep) {
        store.updateOfficer(o.id, {
            status: o.id === faction.leaderId ? OfficerStatus.LORD : OfficerStatus.OFFICER,
            loyalty: Math.min(100, o.loyalty + 30),
        });
    }
    store.updateFaction(factionId, {
        isVagrant: true,
        cities: [],
        armies: [],
        isPlayerControlled: faction.isPlayerControlled,
    });
    const message = `⚔️ ${faction.name}은(는) 영지를 잃고 방랑군이 되었습니다 — 재기를 노립니다 (직속 ${keep.length}명, 이탈 ${release.length}명)`;
    return {
        factionId,
        factionName: faction.name,
        keptOfficers: keep.length,
        releasedOfficers: release.length,
        message,
    };
}
/**
 * 방랑군 세력 ID 목록 조회
 */
export function getVagrantFactionIds(store) {
    return store.getAllFactions().filter(f => f.isVagrant).map(f => f.id);
}
/**
 * 방랑군이 도시를 획득하면 방랑 상태 해제 (재기 성공) [83]
 * 도시 점령 처리부에서 호출
 */
export function clearVagrantOnCityGain(store, factionId) {
    const faction = store.getFaction(factionId);
    if (faction?.isVagrant && store.getCitiesByFaction(factionId).length > 0) {
        store.updateFaction(factionId, { isVagrant: false });
    }
}
/**
 * 재기 연출 [83][421-440] — 방랑군이 도시를 획득해 재기했을 때 군주 격상.
 * 1) 칭호 부여: 획득 도시 1개 = 『州牧』급, 그 이상 = 『刺史』급
 * 2) 명성 +50 (천하에 이름을 다시 알림)
 * 3) 무관 등급 5 미만이면 5(장군급)로 승격
 * 습격/점령 처리부가 clearVagrantOnCityGain 직후 호출한다.
 */
export function performRevivalCeremony(store, factionId) {
    const faction = store.getFaction(factionId);
    if (!faction)
        return null;
    const leader = faction.leaderId ? store.getOfficer(faction.leaderId) : null;
    if (!leader)
        return null;
    const cityCount = store.getCitiesByFaction(factionId).length;
    const title = cityCount >= 2 ? '刺史' : '州牧';
    const fameGain = 50;
    store.updateOfficer(leader.id, {
        fame: leader.fame + fameGain,
        rank: Math.max(OfficerRank.UNRANKED, Math.min(leader.rank, OfficerRank.RANK5)),
    });
    const message = `👑 ${faction.name}의 ${leader.name}이(가) ${title}로 재기했습니다 — 명성 +${fameGain} (거점 ${cityCount})`;
    return {
        factionId,
        factionName: faction.name,
        leaderId: leader.id,
        leaderName: leader.name,
        title,
        fameGain,
        message,
    };
}
//# sourceMappingURL=vagrant_revival_system.js.map