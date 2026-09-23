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
import type { GameStore } from './game_store.js';
import type { FactionID, OfficerID } from './types.js';
export interface VagrantConversion {
    factionId: FactionID;
    factionName: string;
    /** 방랑군 전환 후 유지된 직속 무장 수 */
    keptOfficers: number;
    /** 재야로 방출된 무장 수 (충성도 낮은 부하) */
    releasedOfficers: number;
    message: string;
}
/** Faction 타입에 추가되는 방랑군 플래그 (types.ts의 Faction 확장 — 선택적 필드) */
declare module './types.js' {
    interface Faction {
        /** 방랑군 여부 [83] — 도시 없이 재기를 노리는 세력 */
        isVagrant?: boolean;
    }
}
/**
 * 멸망 직전 세력을 방랑군으로 전환 [83]
 * - 도시 보유 0개 판정 시점(checkFates 이전/이후)에 호출
 * - 군주 + 충성도 상위 무장은 유지, 나머지는 재야 방출
 * - 세력 레코드는 스토어에 남는다 (playerFactionId 유효성 보장)
 */
export declare function convertToFactionVagrant(store: GameStore, factionId: FactionID): VagrantConversion | null;
/**
 * 방랑군 세력 ID 목록 조회
 */
export declare function getVagrantFactionIds(store: GameStore): FactionID[];
/**
 * 방랑군이 도시를 획득하면 방랑 상태 해제 (재기 성공) [83]
 * 도시 점령 처리부에서 호출
 */
export declare function clearVagrantOnCityGain(store: GameStore, factionId: FactionID): void;
/** 재기 연출 결과 — 칭호 승격/명성 상승 내역 */
export interface RevivalCeremony {
    factionId: FactionID;
    factionName: string;
    leaderId: OfficerID;
    leaderName: string;
    /** 군주에게 부여된 칭호 */
    title: string;
    /** 명성 상승량 */
    fameGain: number;
    message: string;
}
/**
 * 재기 연출 [83][421-440] — 방랑군이 도시를 획득해 재기했을 때 군주 격상.
 * 1) 칭호 부여: 획득 도시 1개 = 『州牧』급, 그 이상 = 『刺史』급
 * 2) 명성 +50 (천하에 이름을 다시 알림)
 * 3) 무관 등급 5 미만이면 5(장군급)로 승격
 * 습격/점령 처리부가 clearVagrantOnCityGain 직후 호출한다.
 */
export declare function performRevivalCeremony(store: GameStore, factionId: FactionID): RevivalCeremony | null;
//# sourceMappingURL=vagrant_revival_system.d.ts.map